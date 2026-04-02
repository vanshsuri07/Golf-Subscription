-- 010_winner_verification.sql

-- 1. Verification Status Enum
CREATE TYPE winner_status AS ENUM (
  'pending',
  'under_review',
  'approved',
  'rejected',
  'payout_processing',
  'paid'
);

-- 2. Extend Draw Winners Table
ALTER TABLE public.draw_winners
  ADD COLUMN status winner_status NOT NULL DEFAULT 'pending',
  ADD COLUMN verified_by uuid REFERENCES public.users(id),
  ADD COLUMN verified_at timestamptz,
  ADD COLUMN rejection_reason text,
  ADD COLUMN payout_reference text;

-- 3. RPC State Machine Controller
CREATE OR REPLACE FUNCTION update_winner_status(
  p_winner_id uuid,
  p_new_status winner_status,
  p_admin_id uuid,
  p_reason text DEFAULT null
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current winner_status;
BEGIN
  SELECT status INTO v_current
  FROM public.draw_winners
  WHERE id = p_winner_id;

  IF v_current IS NULL THEN
    RAISE EXCEPTION 'Winner not found';
  END IF;

  -- state validation
  IF NOT (
      (v_current = 'pending' AND p_new_status = 'under_review')
   OR (v_current = 'under_review' AND p_new_status IN ('approved','rejected'))
   OR (v_current = 'approved' AND p_new_status = 'payout_processing')
   OR (v_current = 'payout_processing' AND p_new_status = 'paid')
  ) THEN
    RAISE EXCEPTION 'Invalid state transition from % to %', v_current, p_new_status;
  END IF;

  UPDATE public.draw_winners
  SET
    status = p_new_status,
    verified_by = p_admin_id,
    verified_at = now(),
    rejection_reason = p_reason
  WHERE id = p_winner_id;
END;
$$;

-- 4. Modifying execute_random_draw to include explicit status
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

  INSERT INTO public.draw_winners(draw_id, user_id, status)
  VALUES (p_draw_id, v_winner, 'pending');

  UPDATE public.draw_events
  SET executed_at = now(), is_active = false
  WHERE id = p_draw_id;

  RETURN v_winner;
END;
$$;

-- 5. Modifying execute_weighted_draw to include explicit status
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

  INSERT INTO public.draw_winners(draw_id, user_id, status)
  VALUES (p_draw_id, v_winner, 'pending');

  UPDATE public.draw_events
  SET executed_at = now(), is_active = false
  WHERE id = p_draw_id;

  RETURN v_winner;
END;
$$;
