-- 008_draw_engine.sql

-- 1. Drop obsolete triggers & functions that depend on old columns
DROP TRIGGER IF EXISTS calculate_winners_trigger ON public.draws;
DROP FUNCTION IF EXISTS calculate_winners();

DROP TRIGGER IF EXISTS lock_draw_entries_trigger ON public.draw_entries;

-- 2. Rename existing tables
ALTER TABLE public.draws RENAME TO draw_events;
ALTER TABLE public.winners RENAME TO draw_winners;

-- 3. Modify draw_events
-- Drop obsolete columns
ALTER TABLE public.draw_events DROP COLUMN IF EXISTS status CASCADE;
ALTER TABLE public.draw_events DROP COLUMN IF EXISTS draw_date CASCADE;
ALTER TABLE public.draw_events DROP COLUMN IF EXISTS winning_numbers CASCADE;

-- Add new columns
ALTER TABLE public.draw_events ADD COLUMN name TEXT NOT NULL DEFAULT 'Legacy Draw';
ALTER TABLE public.draw_events ADD COLUMN mode TEXT NOT NULL DEFAULT 'random' CHECK (mode IN ('random', 'weighted'));
ALTER TABLE public.draw_events ADD COLUMN is_active BOOLEAN DEFAULT true;
ALTER TABLE public.draw_events ADD COLUMN executed_at TIMESTAMPTZ;

-- 4. Modify draw_entries
-- Drop obsolete columns (numbers)
ALTER TABLE public.draw_entries DROP COLUMN IF EXISTS numbers CASCADE;

-- Add new columns
ALTER TABLE public.draw_entries ADD COLUMN weight INTEGER NOT NULL DEFAULT 1 CHECK (weight > 0);

-- Clear duplicates by keeping only the most recent entry per (draw_id, user_id) before adding the unique constraint
DELETE FROM public.draw_entries a USING (
    SELECT MIN(ctid) as ctid, draw_id, user_id
    FROM public.draw_entries 
    GROUP BY draw_id, user_id HAVING COUNT(*) > 1
) b
WHERE a.draw_id = b.draw_id 
  AND a.user_id = b.user_id 
  AND a.ctid <> b.ctid;

-- Add Unique Constraint
ALTER TABLE public.draw_entries ADD CONSTRAINT draw_entries_unique_user_draw UNIQUE (draw_id, user_id);

-- 5. Modify draw_winners
-- Drop obsolete columns
ALTER TABLE public.draw_winners DROP COLUMN IF EXISTS draw_entry_id CASCADE;
ALTER TABLE public.draw_winners DROP COLUMN IF EXISTS match_count CASCADE;
ALTER TABLE public.draw_winners DROP COLUMN IF EXISTS prize_amount CASCADE;

-- Add new columns
ALTER TABLE public.draw_winners ADD COLUMN selected_at TIMESTAMPTZ DEFAULT now();

-- Ensure uniqueness
DELETE FROM public.draw_winners a USING (
    SELECT MIN(ctid) as ctid, draw_id, user_id
    FROM public.draw_winners 
    GROUP BY draw_id, user_id HAVING COUNT(*) > 1
) b
WHERE a.draw_id = b.draw_id 
  AND a.user_id = b.user_id 
  AND a.ctid <> b.ctid;

ALTER TABLE public.draw_winners ADD CONSTRAINT draw_winners_unique_user_draw UNIQUE (draw_id, user_id);

-- 6. Modify lock_draw_entries trigger to use the new executed_at/is_active logic
CREATE OR REPLACE FUNCTION lock_draw_entries()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.draw_events 
    WHERE id = COALESCE(NEW.draw_id, OLD.draw_id)
      AND (executed_at IS NOT NULL OR is_active = false)
  ) THEN
    RAISE EXCEPTION 'Cannot modify entries for an inactive or executed draw';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER lock_draw_entries_trigger
BEFORE INSERT OR UPDATE ON public.draw_entries
FOR EACH ROW EXECUTE PROCEDURE lock_draw_entries();

-- 7. Row Level Security Updates
ALTER TABLE public.draw_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.draw_winners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS read_own_entries ON public.draw_entries;
CREATE POLICY read_own_entries
ON public.draw_entries
FOR SELECT
USING (user_id = auth.uid());

DROP POLICY IF EXISTS read_own_wins ON public.draw_winners;
CREATE POLICY read_own_wins
ON public.draw_winners
FOR SELECT
USING (user_id = auth.uid());

-- 8. Phase 1 — Random Mode RPC
CREATE OR REPLACE FUNCTION execute_random_draw(p_draw_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_winner uuid;
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.draw_events
    WHERE id = p_draw_id
    AND executed_at IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'Draw already executed';
  END IF;

  SELECT user_id
  INTO v_winner
  FROM public.draw_entries
  WHERE draw_id = p_draw_id
  ORDER BY random()
  LIMIT 1;

  IF v_winner IS NULL THEN
    RAISE EXCEPTION 'No entries';
  END IF;

  INSERT INTO public.draw_winners(draw_id, user_id)
  VALUES (p_draw_id, v_winner);

  UPDATE public.draw_events
  SET executed_at = now(), is_active = false
  WHERE id = p_draw_id;

  RETURN v_winner;
END;
$$;

-- 9. Phase 2 — Weighted Algorithm RPC
CREATE OR REPLACE FUNCTION execute_weighted_draw(p_draw_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total integer;
  v_rand numeric;
  v_running integer := 0;
  v_winner uuid;
  rec record;
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.draw_events
    WHERE id = p_draw_id
    AND executed_at IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'Draw already executed';
  END IF;

  SELECT sum(weight)
  INTO v_total
  FROM public.draw_entries
  WHERE draw_id = p_draw_id;

  IF v_total IS NULL OR v_total = 0 THEN
    RAISE EXCEPTION 'No entries or zero total weight';
  END IF;

  v_rand := random() * v_total;

  FOR rec IN
    SELECT user_id, weight
    FROM public.draw_entries
    WHERE draw_id = p_draw_id
  LOOP
    v_running := v_running + rec.weight;

    IF v_running >= v_rand THEN
      v_winner := rec.user_id;
      EXIT;
    END IF;
  END LOOP;

  IF v_winner IS NULL THEN
      RAISE EXCEPTION 'Failed to pick a winner (should not happen)';
  END IF;

  INSERT INTO public.draw_winners(draw_id, user_id)
  VALUES (p_draw_id, v_winner);

  UPDATE public.draw_events
  SET executed_at = now(), is_active = false
  WHERE id = p_draw_id;

  RETURN v_winner;
END;
$$;

-- 10. Unified RPC
CREATE OR REPLACE FUNCTION execute_draw(p_draw_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_mode text;
  v_winner uuid;
BEGIN
  SELECT mode INTO v_mode
  FROM public.draw_events
  WHERE id = p_draw_id;

  IF v_mode IS NULL THEN
    RAISE EXCEPTION 'Draw not found';
  END IF;

  IF v_mode = 'random' THEN
    v_winner := execute_random_draw(p_draw_id);
  ELSIF v_mode = 'weighted' THEN
    v_winner := execute_weighted_draw(p_draw_id);
  ELSE
    RAISE EXCEPTION 'Unknown draw mode: %', v_mode;
  END IF;

  RETURN v_winner;
END;
$$;
