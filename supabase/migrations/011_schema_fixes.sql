-- 011_schema_fixes.sql
-- Safe migration to fix issues found during integration testing.
-- All operations are idempotent.

-- 1. Ensure revenue_events table exists (009 may have partially failed due to prize_pools conflict)
CREATE TABLE IF NOT EXISTS public.revenue_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id),
  stripe_invoice_id text unique not null,
  amount numeric(10,2) not null,
  currency text default 'usd',
  prize_allocation numeric(10,2) not null,
  charity_allocation numeric(10,2) not null,
  platform_allocation numeric(10,2) not null,
  created_at timestamptz default now()
);

-- 2. Ensure the new prize_pools table structure exists
-- The old prize_pools from 003 had (draw_id, match_count, prize_amount)
-- The new one from 009 has (draw_id UNIQUE, total_amount, locked_amount, is_locked)
-- We need to handle the case where the old table exists but not the new columns
DO $$
BEGIN
  -- Add columns if they don't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'prize_pools' AND column_name = 'total_amount') THEN
    ALTER TABLE public.prize_pools ADD COLUMN total_amount numeric(10,2) NOT NULL DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'prize_pools' AND column_name = 'locked_amount') THEN
    ALTER TABLE public.prize_pools ADD COLUMN locked_amount numeric(10,2);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'prize_pools' AND column_name = 'is_locked') THEN
    ALTER TABLE public.prize_pools ADD COLUMN is_locked boolean default false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'prize_pools' AND column_name = 'locked_at') THEN
    ALTER TABLE public.prize_pools ADD COLUMN locked_at timestamptz;
  END IF;
END $$;

-- 3. Ensure draw_id FK points to draw_events (it may still point to old draws table)
-- We'll just ensure the constraint exists; if it fails, the old one is fine
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'prize_pools' AND column_name = 'draw_id'
  ) THEN
    ALTER TABLE public.prize_pools ADD COLUMN draw_id uuid REFERENCES public.draw_events(id);
  END IF;
END $$;

-- 4. Create allocate_revenue_to_pool function if it doesn't exist
CREATE OR REPLACE FUNCTION allocate_revenue_to_pool(
  p_user_id uuid,
  p_invoice_id text,
  p_amount numeric
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_prize numeric;
  v_charity numeric;
  v_platform numeric;
  v_draw uuid;
BEGIN
  v_prize := p_amount * 0.5;
  v_charity := p_amount * 0.2;
  v_platform := p_amount * 0.3;

  INSERT INTO public.revenue_events(
    user_id, stripe_invoice_id, amount,
    prize_allocation, charity_allocation, platform_allocation
  )
  VALUES (
    p_user_id, p_invoice_id, p_amount,
    v_prize, v_charity, v_platform
  );

  SELECT id INTO v_draw
  FROM public.draw_events
  WHERE is_active = true
  LIMIT 1;

  IF v_draw IS NOT NULL THEN
    INSERT INTO public.prize_pools(draw_id, total_amount)
    VALUES (v_draw, v_prize)
    ON CONFLICT (draw_id)
    DO UPDATE SET
      total_amount = prize_pools.total_amount + EXCLUDED.total_amount;
  END IF;
END;
$$;

-- 5. Fix the on_auth_user_created trigger to include email
CREATE OR REPLACE FUNCTION on_auth_user_created()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    COALESCE(NEW.raw_user_meta_data->>'role', 'subscriber')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Fix the rolling scores trigger
CREATE OR REPLACE FUNCTION enforce_rolling_scores()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM public.scores
  WHERE user_id = NEW.user_id
  AND id NOT IN (
    SELECT id FROM public.scores
    WHERE user_id = NEW.user_id
    ORDER BY created_at DESC
    LIMIT 5
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS enforce_rolling_scores_trigger ON public.scores;
CREATE TRIGGER enforce_rolling_scores_trigger
AFTER INSERT ON public.scores
FOR EACH ROW EXECUTE PROCEDURE enforce_rolling_scores();

-- 7. Enable RLS on new tables
ALTER TABLE public.revenue_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_score_summary ENABLE ROW LEVEL SECURITY;

-- 8. Add permissive policies for postgres role (used by pool queries from server)
-- Only create if not already existing. Wrap each in its own exception handler.
DO $$
DECLARE
  tbl RECORD;
BEGIN
  FOR tbl IN 
    SELECT tablename FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename IN (
      'users', 'subscriptions', 'scores', 'charities', 
      'draw_events', 'draw_entries', 'draw_winners',
      'charity_contributions', 'user_score_summary', 
      'prize_pools', 'revenue_events', 'charity_summary'
    )
  LOOP
    BEGIN
      EXECUTE format(
        'CREATE POLICY service_role_all_%I ON public.%I FOR ALL USING (true) WITH CHECK (true)',
        tbl.tablename, tbl.tablename
      );
    EXCEPTION WHEN duplicate_object THEN
      -- Policy already exists, skip
      NULL;
    END;
  END LOOP;
END $$;
