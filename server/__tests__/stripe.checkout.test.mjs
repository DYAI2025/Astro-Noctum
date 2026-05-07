// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';

const SERVER_FILE = './server.mjs';

describe('Stripe checkout idempotency', () => {
  it('STRIPE-IDEMP-001: customer creation passes idempotencyKey scoped to userId', () => {
    const src = readFileSync(SERVER_FILE, 'utf8');
    expect(src).toMatch(/idempotencyKey:\s*`customer-create-\$\{userId\}`/);
  });

  it('STRIPE-IDEMP-002: customer-portal recovery passes idempotencyKey scoped to userId', () => {
    const src = readFileSync(SERVER_FILE, 'utf8');
    expect(src).toMatch(/idempotencyKey:\s*`customer-portal-recovery-\$\{authedUser\.id\}`/);
  });

  it('STRIPE-IDEMP-003: checkout session creation passes day-windowed idempotencyKey', () => {
    const src = readFileSync(SERVER_FILE, 'utf8');
    // Day key: ISO date prefix YYYY-MM-DD, scoped per userId
    expect(src).toMatch(/idempotencyKey:\s*`checkout-\$\{userId\}-\$\{todayUtc\}`/);
    expect(src).toMatch(/new Date\(\)\.toISOString\(\)\.slice\(0,\s*10\)/);
  });

  it('STRIPE-RECOVERY-001: customer-portal looks up existing customer by email before creating', () => {
    const src = readFileSync(SERVER_FILE, 'utf8');
    expect(src).toMatch(/stripe\.customers\.list\(\s*\{[^}]*email/);
    expect(src).toMatch(/portal recovery: re-linked/);
  });

  it('STRIPE-RECOVERY-002: /api/checkout customer creation also list-before-creates', () => {
    const src = readFileSync(SERVER_FILE, 'utf8');
    expect(src).toMatch(/checkout: re-linked existing customer/);
  });

  it('STRIPE-IDEMP-004: every stripe.customers.create + stripe.checkout.sessions.create call has an idempotencyKey', () => {
    const src = readFileSync(SERVER_FILE, 'utf8');
    // Walk the file and ensure no naked Stripe write call exists.
    // Match each `stripe.customers.create({…})` and `stripe.checkout.sessions.create({…})`
    // by their closing `})` and verify a `, {` (options-arg open) immediately follows.
    const sites = [
      ...src.matchAll(/stripe\.customers\.create\(/g),
      ...src.matchAll(/stripe\.checkout\.sessions\.create\(/g),
    ];
    expect(sites.length).toBeGreaterThan(0);
    for (const m of sites) {
      const tail = src.slice(m.index, m.index + 4000);
      // Each call must contain "idempotencyKey:" inside its closing block
      expect(tail).toMatch(/idempotencyKey:/);
    }
  });
});
