-- Migration: 005_score_system
-- Description: Implement score entry system with rolling 5-score logic computation (no RLS).

-- 1. Drop existing scores table
DROP TABLE IF EXISTS public.scores CASCADE;

-- 2. Create the strict scores table
CREATE TABLE public.scores (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  score integer NOT NULL CHECK (score >= 0),
  created_at timestamptz DEFAULT now()
);

-- 3. Create the user_score_summary table
CREATE TABLE public.user_score_summary (
  user_id uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  last_5_avg numeric,
  last_5_scores integer[],
  updated_at timestamptz DEFAULT now()
);

-- 4. Create the submit_score RPC function
-- Uses p_user_id explicitly since we perform authorization in the server action.
CREATE OR REPLACE FUNCTION submit_score(p_user_id uuid, p_score integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  last5 integer[];
  avg_score numeric;
BEGIN
  -- insert score
  INSERT INTO public.scores(user_id, score)
  VALUES (p_user_id, p_score);

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
END;
$$;
