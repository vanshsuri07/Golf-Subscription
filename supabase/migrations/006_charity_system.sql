-- Migration: 006_charity_system
-- Description: Adds user charity selection and automated score-based contributions.

-- 1. Alter charities table to include is_active
ALTER TABLE public.charities
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 2. Alter users table to include charity_id
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS charity_id UUID REFERENCES public.charities(id) ON DELETE SET NULL;

-- 3. Modify charity_contributions for score support
-- Make draw_id nullable so we can reuse the table for score contributions
ALTER TABLE public.charity_contributions
ALTER COLUMN draw_id DROP NOT NULL;

ALTER TABLE public.charity_contributions
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS score_id UUID REFERENCES public.scores(id) ON DELETE SET NULL;

-- 4. Create charity_summary table for fast dashboard reads
CREATE TABLE IF NOT EXISTS public.charity_summary (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  charity_id UUID NOT NULL REFERENCES public.charities(id),
  total_contribution NUMERIC(10,2) NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Seed some initial charities if table is empty
INSERT INTO public.charities (name, description, is_active)
SELECT 'St. Jude Children''s Research Hospital', 'Advancing cures, and means of prevention, for pediatric catastrophic diseases.', true
WHERE NOT EXISTS (SELECT 1 FROM public.charities WHERE name = 'St. Jude Children''s Research Hospital');

INSERT INTO public.charities (name, description, is_active)
SELECT 'The Nature Conservancy', 'Protecting the lands and waters on which all life depends.', true
WHERE NOT EXISTS (SELECT 1 FROM public.charities WHERE name = 'The Nature Conservancy');

INSERT INTO public.charities (name, description, is_active)
SELECT 'World Central Kitchen', 'Providing meals in response to humanitarian, climate, and community crises.', true
WHERE NOT EXISTS (SELECT 1 FROM public.charities WHERE name = 'World Central Kitchen');

-- 6. Create process_charity_contribution RPC
CREATE OR REPLACE FUNCTION process_charity_contribution(
  p_user_id UUID,
  p_score_id UUID,
  p_last5_avg NUMERIC
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_charity_id UUID;
  v_amount NUMERIC;
  v_baseline INTEGER := 72;
  v_multiplier NUMERIC := 0.50;
BEGIN
  -- Replicate existing charity look up
  SELECT charity_id
  INTO v_charity_id
  FROM public.users
  WHERE id = p_user_id;

  IF v_charity_id IS NULL THEN
    RETURN;
  END IF;

  -- Ensure minimum 0
  v_amount := GREATEST(0, (v_baseline - p_last5_avg) * v_multiplier);

  -- Insert ledger entry
  INSERT INTO public.charity_contributions (
    user_id,
    charity_id,
    score_id,
    amount
  )
  VALUES (
    p_user_id,
    v_charity_id,
    p_score_id,
    v_amount
  );

  -- UPSERT into summary
  INSERT INTO public.charity_summary (
    user_id,
    charity_id,
    total_contribution,
    updated_at
  )
  VALUES (
    p_user_id,
    v_charity_id,
    v_amount,
    now()
  )
  ON CONFLICT (user_id)
  DO UPDATE SET
    total_contribution = charity_summary.total_contribution + EXCLUDED.total_contribution,
    charity_id = EXCLUDED.charity_id, -- update if they changed charities
    updated_at = now();
END;
$$;

-- 7. Overwrite submit_score to call process_charity_contribution atomically
CREATE OR REPLACE FUNCTION submit_score(p_user_id uuid, p_score integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  last5 integer[];
  avg_score numeric;
  new_score_id uuid;
BEGIN
  -- insert score and capture id
  INSERT INTO public.scores(user_id, score)
  VALUES (p_user_id, p_score)
  RETURNING id INTO new_score_id;

  -- get last 5
  SELECT array(
    SELECT score
    FROM public.scores
    WHERE user_id = p_user_id
    ORDER BY created_at DESC
    LIMIT 5
  )
  INTO last5;

  -- compute average
  SELECT avg(x) INTO avg_score
  FROM unnest(last5) AS x;

  -- upsert summary
  INSERT INTO public.user_score_summary(
    user_id,
    last_5_scores,
    last_5_avg,
    updated_at
  )
  VALUES (p_user_id, last5, avg_score, now())
  ON CONFLICT (user_id)
  DO UPDATE SET
    last_5_scores = EXCLUDED.last_5_scores,
    last_5_avg = EXCLUDED.last_5_avg,
    updated_at = now();

  -- Now run the charity computation synchronously
  PERFORM process_charity_contribution(p_user_id, new_score_id, avg_score);
END;
$$;
