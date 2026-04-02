-- Alter subscriptions table
ALTER TABLE public.subscriptions
  ALTER COLUMN status TYPE TEXT USING status::TEXT,
  ALTER COLUMN charity_id DROP NOT NULL,
  ALTER COLUMN charity_pct DROP NOT NULL,
  ADD COLUMN stripe_customer_id TEXT,
  ADD COLUMN stripe_subscription_id TEXT UNIQUE,
  ADD COLUMN price_id TEXT,
  ADD COLUMN current_period_end TIMESTAMPTZ,
  ADD COLUMN cancel_at_period_end BOOLEAN DEFAULT false;

-- Drop constraints related to charity_pct if needed, or leave it as check constraint which allows NULL
-- Wait, the check constraint in 003_tables.sql is: charity_pct INT NOT NULL CHECK (charity_pct BETWEEN 0 AND 100)
-- Dropping NOT NULL allows NULL values, and check constraint on NULL evaluates to TRUE in Postgres, so it's fine.

-- Drop the old enum if it's no longer used
DROP TYPE IF EXISTS subscription_status_enum CASCADE;
