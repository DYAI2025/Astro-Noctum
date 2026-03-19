// src/__tests__/stripe-checkout.test.ts
import { describe, it, expect } from 'vitest';

describe('Stripe checkout configuration', () => {
  it('checkout route uses payment mode', async () => {
    // Verify the server code has mode: "payment" (not "subscription")
    const fs = await import('fs');
    const serverCode = fs.readFileSync('server.mjs', 'utf8');
    expect(serverCode).toContain('mode: "payment"');
  });

  it('webhook handles checkout.session.completed', async () => {
    const fs = await import('fs');
    const serverCode = fs.readFileSync('server.mjs', 'utf8');
    expect(serverCode).toContain('checkout.session.completed');
    expect(serverCode).toContain('tier: "premium"');
  });

  it('CSP allows Stripe checkout iframe', async () => {
    const fs = await import('fs');
    const serverCode = fs.readFileSync('server.mjs', 'utf8');
    expect(serverCode).toContain('checkout.stripe.com');
  });

  it('webhook uses raw body parser (required for signature verification)', async () => {
    const fs = await import('fs');
    const serverCode = fs.readFileSync('server.mjs', 'utf8');
    // Must use express.raw() NOT express.json() for webhook
    expect(serverCode).toMatch(/webhook\/stripe.*express\.raw/s);
  });
});
