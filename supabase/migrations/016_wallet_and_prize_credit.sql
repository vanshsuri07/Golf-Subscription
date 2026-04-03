-- 016_wallet_and_prize_credit.sql
-- Adds wallet balance to users and auto-credit logic when a winner is marked paid

-- 1. Add wallet balance to users
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS wallet_balance NUMERIC(10,2) NOT NULL DEFAULT 0;

-- 2. Add charity rate to prize_pools (configurable per draw, default 20%)
ALTER TABLE public.prize_pools
  ADD COLUMN IF NOT EXISTS charity_rate NUMERIC(4,4) NOT NULL DEFAULT 0.20;

-- 3. Track whether a winner record has been credited (prevents double-credit)
ALTER TABLE public.draw_winners
  ADD COLUMN IF NOT EXISTS prize_credited BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS net_payout NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS charity_deduction NUMERIC(10,2);

-- 4. credit_winner_payout function
--    Called automatically when a winner status transitions to 'paid'
CREATE OR REPLACE FUNCTION credit_winner_payout(p_winner_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id     uuid;
  v_draw_id     uuid;
  v_pool_amount NUMERIC(10,2);
  v_rate        NUMERIC(4,4);
  v_charity_cut NUMERIC(10,2);
  v_net         NUMERIC(10,2);
  v_charity_id  uuid;
BEGIN
  -- Guard: already credited
  IF EXISTS (
    SELECT 1 FROM public.draw_winners
    WHERE id = p_winner_id AND prize_credited = TRUE
  ) THEN
    RETURN;
  END IF;

  -- Get winner details
  SELECT user_id, draw_id
  INTO v_user_id, v_draw_id
  FROM public.draw_winners
  WHERE id = p_winner_id;

  -- Get locked prize pool amount and charity rate
  SELECT
    COALESCE(locked_amount, total_amount, 0),
    COALESCE(charity_rate, 0.20)
  INTO v_pool_amount, v_rate
  FROM public.prize_pools
  WHERE draw_id = v_draw_id;

  -- Nothing to credit if pool is zero
  IF v_pool_amount IS NULL OR v_pool_amount <= 0 THEN
    RETURN;
  END IF;

  -- Calculate splits
  v_charity_cut := ROUND(v_pool_amount * v_rate, 2);
  v_net         := v_pool_amount - v_charity_cut;

  -- Get user's selected charity
  SELECT charity_id INTO v_charity_id
  FROM public.users
  WHERE id = v_user_id;

  -- Record charity contribution (if charity selected)
  IF v_charity_id IS NOT NULL AND v_charity_cut > 0 THEN
    INSERT INTO public.charity_contributions (user_id, charity_id, amount)
    VALUES (v_user_id, v_charity_id, v_charity_cut);
  END IF;

  -- Credit net payout to user's wallet
  UPDATE public.users
  SET wallet_balance = wallet_balance + v_net
  WHERE id = v_user_id;

  -- Mark winner as credited and store amounts for display
  UPDATE public.draw_winners
  SET
    prize_credited   = TRUE,
    net_payout       = v_net,
    charity_deduction = v_charity_cut
  WHERE id = p_winner_id;

END;
$$;

-- 5. Update update_winner_status to call credit_winner_payout on 'paid' transition
CREATE OR REPLACE FUNCTION update_winner_status(
  p_winner_id  uuid,
  p_new_status winner_status,
  p_admin_id   uuid,
  p_reason     text DEFAULT null
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

  -- State machine validation
  IF NOT (
      (v_current = 'pending'           AND p_new_status = 'under_review')
   OR (v_current = 'under_review'      AND p_new_status IN ('approved', 'rejected'))
   OR (v_current = 'approved'          AND p_new_status = 'payout_processing')
   OR (v_current = 'payout_processing' AND p_new_status = 'paid')
   -- Allow pending -> approved shortcut as well
   OR (v_current = 'pending'           AND p_new_status IN ('approved', 'rejected'))
  ) THEN
    RAISE EXCEPTION 'Invalid state transition from % to %', v_current, p_new_status;
  END IF;

  UPDATE public.draw_winners
  SET
    status           = p_new_status,
    verified_by      = p_admin_id,
    verified_at      = now(),
    rejection_reason = p_reason
  WHERE id = p_winner_id;

  -- Auto-credit on paid transition
  IF p_new_status = 'paid' THEN
    PERFORM credit_winner_payout(p_winner_id);
  END IF;

END;
$$;

-- 6. Allow admins to update prize pool amount on existing active draws
--    (Simple upsert RPC usable from server action)
CREATE OR REPLACE FUNCTION set_prize_pool(
  p_draw_id uuid,
  p_amount  NUMERIC
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.prize_pools (draw_id, total_amount)
  VALUES (p_draw_id, p_amount)
  ON CONFLICT (draw_id)
  DO UPDATE SET total_amount = EXCLUDED.total_amount;
END;
$$;
