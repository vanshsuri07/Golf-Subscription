-- 009_prize_pool.sql

-- 1. Create Revenue Ledger Table
CREATE TABLE public.revenue_events (
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

-- 2. Create Prize Pools Table
CREATE TABLE public.prize_pools (
  id uuid primary key default gen_random_uuid(),
  draw_id uuid unique references public.draw_events(id),

  total_amount numeric(10,2) not null default 0,
  locked_amount numeric(10,2),

  is_locked boolean default false,
  created_at timestamptz default now(),
  locked_at timestamptz
);

-- 3. Allocation RPC
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
  -- allocation logic
  v_prize := p_amount * 0.5;
  v_charity := p_amount * 0.2;
  v_platform := p_amount * 0.3;

  INSERT INTO public.revenue_events(
    user_id,
    stripe_invoice_id,
    amount,
    prize_allocation,
    charity_allocation,
    platform_allocation
  )
  VALUES (
    p_user_id,
    p_invoice_id,
    p_amount,
    v_prize,
    v_charity,
    v_platform
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

-- 4. Update execute_draw RPC to lock the pool
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

  -- Lock the prize pool
  UPDATE public.prize_pools
  SET
    locked_amount = total_amount,
    is_locked = true,
    locked_at = now()
  WHERE draw_id = p_draw_id;

  RETURN v_winner;
END;
$$;
