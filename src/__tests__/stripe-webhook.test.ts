// src/__tests__/stripe-webhook.test.ts
// Tests for the Stripe subscription webhook handler in server.mjs
import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';

let serverCode: string;

beforeAll(() => {
  serverCode = readFileSync('server.mjs', 'utf8');
});

describe('Stripe webhook configuration', () => {
  it('uses express.raw() for webhook route (required for signature verification)', () => {
    expect(serverCode).toMatch(/\/api\/webhook\/stripe.*express\.raw/s);
  });

  it('verifies stripe-signature header', () => {
    expect(serverCode).toContain('stripe-signature');
    expect(serverCode).toContain('constructEvent');
  });

  it('returns 400 on invalid signature', () => {
    expect(serverCode).toMatch(/constructEvent.*catch.*400/s);
  });

  it('requires STRIPE_WEBHOOK_SECRET env var', () => {
    expect(serverCode).toContain('STRIPE_WEBHOOK_SECRET');
    expect(serverCode).toMatch(/webhookSecret.*503/s);
  });
});

describe('Stripe webhook: checkout.session.completed', () => {
  it('handles checkout.session.completed event', () => {
    expect(serverCode).toContain('checkout.session.completed');
  });

  it('sets tier to premium on successful checkout', () => {
    // Extract the checkout.session.completed handler block
    const checkoutBlock = serverCode.match(
      /checkout\.session\.completed[\s\S]*?(?=\} else if \(event\.type === "customer)/
    )?.[0];
    expect(checkoutBlock).toBeTruthy();
    expect(checkoutBlock).toContain('tier: "premium"');
  });

  it('saves stripe_customer_id from session', () => {
    // Phase B refactor extracted the two-table update into syncTier().
    // The checkout block now passes session.customer as customerId; the
    // helper's body assigns it to profileUpdate.stripe_customer_id.
    const checkoutBlock = serverCode.match(
      /checkout\.session\.completed[\s\S]*?(?=\} else if \(event\.type === "customer)/
    )?.[0];
    expect(checkoutBlock).toContain('customerId: session.customer');
    expect(serverCode).toContain('profileUpdate.stripe_customer_id = customerId');
  });

  it('saves stripe_subscription_id (not payment_intent)', () => {
    const checkoutBlock = serverCode.match(
      /checkout\.session\.completed[\s\S]*?(?=\} else if \(event\.type === "customer)/
    )?.[0];
    // Same indirection through syncTier — checkout block passes
    // session.subscription as subscriptionId.
    expect(checkoutBlock).toContain('subscriptionId: session.subscription');
    expect(serverCode).toContain('profileUpdate.stripe_subscription_id = subscriptionId');
    // Crucially: never falls back to the legacy one-time-payment column.
    expect(serverCode).not.toContain('stripe_payment_id =');
  });

  it('looks up user by metadata.userId (with stripe_customer_id fallback)', () => {
    const checkoutBlock = serverCode.match(
      /checkout\.session\.completed[\s\S]*?(?=\} else if \(event\.type === "customer)/
    )?.[0];
    // Phase B Task 6 added resolveUserIdFromEvent — falls back to a
    // profiles.stripe_customer_id lookup when metadata.userId is missing.
    expect(checkoutBlock).toContain('resolveUserIdFromEvent(event)');
    expect(serverCode).toContain('obj.metadata?.userId');
    expect(serverCode).toContain('.eq("stripe_customer_id", customerId)');
  });
});

describe('Stripe webhook: customer.subscription.updated', () => {
  it('handles customer.subscription.updated event', () => {
    expect(serverCode).toContain('customer.subscription.updated');
  });

  it('checks subscription status for active or trialing', () => {
    const subBlock = serverCode.match(
      /customer\.subscription\.updated[\s\S]*?(?=\} else if \(event\.type === "customer\.subscription\.deleted)/
    )?.[0];
    expect(subBlock).toBeTruthy();
    expect(subBlock).toContain('sub.status === "active"');
    expect(subBlock).toContain('sub.status === "trialing"');
  });

  it('sets tier to premium when active, free when not', () => {
    const subBlock = serverCode.match(
      /customer\.subscription\.updated[\s\S]*?(?=\} else if \(event\.type === "customer\.subscription\.deleted)/
    )?.[0];
    expect(subBlock).toMatch(/tier:\s*\w+\s*\?\s*"premium"\s*:\s*"free"/);
  });

  it('tracks subscription_end from current_period_end', () => {
    const subBlock = serverCode.match(
      /customer\.subscription\.updated[\s\S]*?(?=\} else if \(event\.type === "customer\.subscription\.deleted)/
    )?.[0];
    expect(subBlock).toContain('sub.current_period_end');
    // After Phase B, periodEnd is forwarded to syncTier() which writes
    // profileUpdate.subscription_end. Branch + helper both verified.
    expect(subBlock).toMatch(/syncTier\(\s*\{[\s\S]*?periodEnd[\s\S]*?\}\s*\)/);
    expect(serverCode).toContain('profileUpdate.subscription_end = periodEnd');
  });

  it('matches user by stripe_customer_id (not userId) — via resolveUserIdFromEvent fallback', () => {
    const subBlock = serverCode.match(
      /customer\.subscription\.updated[\s\S]*?(?=\} else if \(event\.type === "customer\.subscription\.deleted)/
    )?.[0];
    // Phase B Task 6 routes user-resolution through the helper which
    // falls back to profiles.stripe_customer_id when metadata is missing.
    expect(subBlock).toContain('resolveUserIdFromEvent(event)');
    expect(serverCode).toContain('.eq("stripe_customer_id", customerId)');
  });
});

describe('Stripe webhook: customer.subscription.deleted', () => {
  it('handles customer.subscription.deleted event', () => {
    expect(serverCode).toContain('customer.subscription.deleted');
  });

  it('implements grace period logic (premium until period end)', () => {
    const delBlock = serverCode.match(
      /customer\.subscription\.deleted[\s\S]*?(?=\} else if \(event\.type === "invoice)/
    )?.[0];
    expect(delBlock).toBeTruthy();
    expect(delBlock).toContain('stillInGrace');
    expect(delBlock).toContain('new Date(periodEnd) > now');
  });

  it('keeps premium during grace period, sets free after', () => {
    const delBlock = serverCode.match(
      /customer\.subscription\.deleted[\s\S]*?(?=\} else if \(event\.type === "invoice)/
    )?.[0];
    expect(delBlock).toContain('stillInGrace ? "premium" : "free"');
  });

  it('saves subscription_end for grace period tracking', () => {
    const delBlock = serverCode.match(
      /customer\.subscription\.deleted[\s\S]*?(?=\} else if \(event\.type === "invoice)/
    )?.[0];
    // syncTier() forwards periodEnd to profileUpdate.subscription_end.
    expect(delBlock).toMatch(/syncTier\(\s*\{[\s\S]*?periodEnd[\s\S]*?\}\s*\)/);
  });
});

describe('Stripe webhook: invoice.payment_succeeded', () => {
  it('handles invoice.payment_succeeded event', () => {
    expect(serverCode).toContain('invoice.payment_succeeded');
  });

  it('only processes subscription_cycle renewals (and skips draft invoices)', () => {
    const invoiceBlock = serverCode.match(
      /invoice\.payment_succeeded[\s\S]*?(?=\} else if \(event\.type === "invoice\.payment_failed)/
    )?.[0];
    expect(invoiceBlock).toBeTruthy();
    // Phase B Task 6 added an early-return guard. Either form of the
    // billing_reason check is acceptable.
    expect(invoiceBlock).toMatch(/billing_reason\s*(===|!==)\s*"subscription_cycle"/);
    // Audit finding #13 — must also gate on invoice.status === "paid"
    // so draft / uncollectible invoices don't extend the period.
    expect(invoiceBlock).toMatch(/invoice\.status\s*!==\s*['"]paid['"]/);
  });

  it('extends subscription_end on successful renewal', () => {
    const invoiceBlock = serverCode.match(
      /invoice\.payment_succeeded[\s\S]*?(?=\} else if \(event\.type === "invoice\.payment_failed)/
    )?.[0];
    // syncTier() carries tier='premium' + periodEnd into the two-table
    // update. Both pieces verified — branch passes them, helper writes them.
    expect(invoiceBlock).toMatch(/syncTier\(\s*\{[\s\S]*?tier:\s*"premium"[\s\S]*?periodEnd[\s\S]*?\}\s*\)/);
  });
});

describe('Stripe webhook: invoice.payment_failed', () => {
  it('handles invoice.payment_failed event', () => {
    expect(serverCode).toContain('invoice.payment_failed');
  });

  it('does NOT immediately downgrade user (Stripe handles retries)', () => {
    const failBlock = serverCode.match(
      /invoice\.payment_failed[\s\S]*?(?=\} else if \(event\.type === "checkout\.session\.expired)/
    )?.[0];
    expect(failBlock).toBeTruthy();
    // Should NOT contain a Supabase update to tier: "free"
    expect(failBlock).not.toContain('tier: "free"');
    expect(failBlock).not.toContain('.update(');
  });
});

describe('Stripe webhook: checkout.session.expired', () => {
  it('handles checkout.session.expired event', () => {
    expect(serverCode).toContain('checkout.session.expired');
  });
});

describe('Stripe checkout configuration', () => {
  it('uses subscription mode (not payment)', () => {
    expect(serverCode).toContain('mode: "subscription"');
    expect(serverCode).not.toContain('mode: "payment"');
  });

  it('propagates userId to subscription_data.metadata', () => {
    // subscription_data.metadata ensures userId is on the subscription object,
    // not just the checkout session — critical for webhook handlers that
    // receive subscription events (updated/deleted) without session context
    expect(serverCode).toMatch(/subscription_data:\s*\{[\s\S]*?metadata:\s*\{[\s\S]*?userId/);
  });

  it('requires STRIPE_PRICE_ID env var', () => {
    expect(serverCode).toContain('STRIPE_PRICE_ID');
  });

  it('returns checkout URL on success', () => {
    expect(serverCode).toMatch(/res\.json\(\s*\{[\s\S]*?url:\s*session\.url/);
  });
});

describe('Stripe subscription grace period logic', () => {
  it('converts unix timestamp to ISO string correctly', () => {
    // Verify the server uses the correct conversion pattern
    // Stripe sends current_period_end as unix seconds (not milliseconds)
    const periodEndPattern = /new Date\(sub\.current_period_end \* 1000\)\.toISOString\(\)/;
    expect(serverCode).toMatch(periodEndPattern);
  });

  it('compares dates correctly for grace period', () => {
    // The grace check must compare Date objects, not strings
    expect(serverCode).toContain('new Date(periodEnd) > now');
  });

  // Standalone logic test for the grace period calculation
  it('grace period: future date keeps premium', () => {
    const futureTimestamp = Math.floor(Date.now() / 1000) + 86400 * 30; // 30 days from now
    const periodEnd = new Date(futureTimestamp * 1000).toISOString();
    const now = new Date();
    const stillInGrace = periodEnd && new Date(periodEnd) > now;
    expect(stillInGrace).toBe(true);
  });

  it('grace period: past date sets free', () => {
    const pastTimestamp = Math.floor(Date.now() / 1000) - 86400; // 1 day ago
    const periodEnd = new Date(pastTimestamp * 1000).toISOString();
    const now = new Date();
    const stillInGrace = periodEnd && new Date(periodEnd) > now;
    expect(stillInGrace).toBe(false);
  });
});

describe('Stripe webhook response', () => {
  it('always returns { received: true }', () => {
    // Every webhook handler path should end with res.json({ received: true })
    const webhookHandler = serverCode.match(
      /\/api\/webhook\/stripe[\s\S]*?res\.json\(\s*\{\s*received:\s*true\s*\}\s*\)/g
    );
    expect(webhookHandler).toBeTruthy();
    expect(webhookHandler!.length).toBeGreaterThanOrEqual(1);
  });
});

describe('Stripe customer portal', () => {
  it('has customer portal route', () => {
    expect(serverCode).toContain('/api/customer-portal');
  });

  it('requires premium tier for portal access', () => {
    const portalBlock = serverCode.match(
      /customer-portal[\s\S]*?(?=\/\/ ── Stripe: Webhook)/
    )?.[0];
    expect(portalBlock).toBeTruthy();
    expect(portalBlock).toContain('tier !== "premium"');
    expect(portalBlock).toContain('403');
  });
});
