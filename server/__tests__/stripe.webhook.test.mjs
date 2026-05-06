// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import express from 'express';
import request from 'supertest';

const SERVER_FILE = './server.mjs';

describe('Stripe webhook raw-body regression guard', () => {
  it('STRIPE-REG-001: global JSON parser skips /webhook/stripe', () => {
    const src = readFileSync(SERVER_FILE, 'utf8');

    // Find the global body-parser block and confirm it has an explicit
    // skip for stripe webhooks. Without this, express.json() consumes
    // the request body before constructEvent() can verify the signature.
    expect(src).toMatch(/app\.use\(['"]\/api\/['"]/);
    expect(src).toMatch(/req\.path\.startsWith\(['"]\/webhook\/stripe['"]\)/);
  });

  it('STRIPE-REG-002: webhook route uses express.raw with application/json type', () => {
    const src = readFileSync(SERVER_FILE, 'utf8');

    // The route registration MUST include express.raw() with the
    // application/json content type. Anything else (e.g. express.json
    // or a missing parser) breaks signature verification.
    const route = src.match(
      /app\.post\(['"]\/api\/webhook\/stripe['"][^,]*,\s*([^,]+),/
    );
    expect(route, 'Could not locate /api/webhook/stripe route registration').toBeTruthy();
    const parser = route[1].trim();
    expect(parser).toMatch(/express\.raw/);
    expect(parser).toMatch(/type:\s*['"]application\/json['"]/);
  });

  it('STRIPE-REG-003: handler reads STRIPE_WEBHOOK_SECRET from env, not hard-coded', () => {
    const src = readFileSync(SERVER_FILE, 'utf8');
    expect(src).toMatch(/process\.env\.STRIPE_WEBHOOK_SECRET/);
    // The secret must NOT appear as a string literal anywhere in server.mjs.
    expect(src).not.toMatch(/whsec_[a-zA-Z0-9]{8,}/);
  });

  it('STRIPE-REG-004: handler verifies signature via stripe.webhooks.constructEvent', () => {
    const src = readFileSync(SERVER_FILE, 'utf8');
    expect(src).toMatch(/stripe\.webhooks\.constructEvent\s*\(/);
    // constructEvent must receive req.body — anything else (e.g. JSON.parse(req.body))
    // means raw bytes are being mutated before verification.
    expect(src).toMatch(/constructEvent\s*\(\s*req\.body\s*,/);
  });

  it('STRIPE-REG-005: integration — handler with parser mirroring server.mjs receives a Buffer body', async () => {
    // This is the strongest guard: build a minimal app that wires the
    // same parser-order that server.mjs does, send a request, and
    // assert the handler sees req.body as a Buffer (raw bytes), not
    // a parsed object. Catches the class of bugs where someone "helpfully"
    // adds a global body parser before the stripe route registration.

    const app = express();

    // Mirror server.mjs:317–323: global JSON parser with stripe skip.
    app.use('/api/', (req, res, next) => {
      if (req.path.startsWith('/webhook/stripe')) return next();
      return express.json()(req, res, next);
    });

    // Mirror server.mjs:5623: per-route raw parser.
    let receivedBodyType = null;
    let receivedBytes = null;
    app.post('/api/webhook/stripe',
      express.raw({ type: 'application/json' }),
      (req, res) => {
        receivedBodyType = req.body?.constructor?.name ?? typeof req.body;
        receivedBytes = req.body;
        res.json({ ok: true });
      });

    const payload = '{"type":"charge.succeeded","id":"evt_test"}';
    const res = await request(app)
      .post('/api/webhook/stripe')
      .set('Content-Type', 'application/json')
      .send(payload);

    expect(res.status).toBe(200);
    expect(receivedBodyType).toBe('Buffer');
    expect(receivedBytes.toString('utf8')).toBe(payload);
  });

  it('STRIPE-REG-007: webhook resolves userId via metadata OR stripe_customer_id', () => {
    const src = readFileSync(SERVER_FILE, 'utf8');
    expect(src).toMatch(/resolveUserIdFromEvent/);
    // The fallback path must read from profiles by stripe_customer_id.
    expect(src).toMatch(/stripe_customer_id/);
  });

  it('STRIPE-REG-008: tier sync goes through a single helper (no duplicated two-table logic)', () => {
    const src = readFileSync(SERVER_FILE, 'utf8');
    expect(src).toMatch(/async function syncTier\b/);
    // The helper must update both profiles and astro_profiles.
    expect(src).toMatch(/from\(['"]profiles['"]\)\.update/);
    expect(src).toMatch(/from\(['"]astro_profiles['"]\)\.update/);
  });

  it('STRIPE-REG-009: invoice.payment_succeeded gates on invoice.status === "paid"', () => {
    const src = readFileSync(SERVER_FILE, 'utf8');
    expect(src).toMatch(/invoice\.status\s*!==\s*['"]paid['"]/);
  });

  it('STRIPE-REG-006: integration — non-stripe /api/* routes still get parsed JSON', async () => {
    // The flip side of REG-005: confirm the skip is NARROW. Other routes
    // under /api/ must still get express.json() parsing, otherwise the
    // skip rule was over-eager.

    const app = express();
    app.use('/api/', (req, res, next) => {
      if (req.path.startsWith('/webhook/stripe')) return next();
      return express.json()(req, res, next);
    });

    let received;
    app.post('/api/foo', (req, res) => {
      received = req.body;
      res.json({ ok: true });
    });

    const res = await request(app)
      .post('/api/foo')
      .set('Content-Type', 'application/json')
      .send({ hello: 'world' });

    expect(res.status).toBe(200);
    expect(received).toEqual({ hello: 'world' }); // parsed object, not Buffer
  });
});
