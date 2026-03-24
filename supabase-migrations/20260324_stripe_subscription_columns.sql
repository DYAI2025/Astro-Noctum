-- Migration: 2026-03-24 stripe subscription columns
-- Replaces one-time stripe_payment_id with subscription tracking fields

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS subscription_end TIMESTAMPTZ;

-- stripe_payment_id was for one-time payments; keep for history but
-- new subscription flow uses stripe_subscription_id instead.
-- Do NOT drop stripe_payment_id — existing rows may reference it.

COMMENT ON COLUMN profiles.stripe_subscription_id IS 'Stripe subscription ID (sub_xxx). Set on checkout.session.completed.';
COMMENT ON COLUMN profiles.subscription_end IS 'UTC timestamp when current subscription period ends. Set on subscription.updated/deleted. Used to grant access until period end on cancellation.';
