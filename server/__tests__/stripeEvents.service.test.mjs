// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Single shared spies — vi.mock factory is hoisted so spies must be
// hoisted alongside it.
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockEq = vi.fn();

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: () => ({
      insert: (...args) => mockInsert(...args),
      update: (...args) => {
        mockUpdate(...args);
        return { eq: (...e) => mockEq(...e) };
      },
    }),
  }),
}));

describe('claimStripeEvent', () => {
  let claimStripeEvent;

  beforeEach(async () => {
    mockInsert.mockReset();
    mockUpdate.mockReset();
    mockEq.mockReset();
    const mod = await import('../services/stripeEvents.service.mjs');
    claimStripeEvent = mod.claimStripeEvent;
  });

  it('STRIPE-EVT-001: returns true on first sighting (insert succeeds)', async () => {
    mockInsert.mockResolvedValue({ error: null });
    const result = await claimStripeEvent({
      id: 'evt_1', type: 'checkout.session.completed', livemode: false,
      api_version: '2024-12-15', data: { object: { id: 'cs_1', object: 'checkout.session' } },
    });
    expect(result).toBe(true);
    expect(mockInsert).toHaveBeenCalledTimes(1);
  });

  it('STRIPE-EVT-002: returns false on duplicate (23505 unique violation)', async () => {
    mockInsert.mockResolvedValue({ error: { code: '23505', message: 'duplicate key' } });
    const result = await claimStripeEvent({
      id: 'evt_2', type: 'invoice.payment_succeeded', livemode: true, data: {},
    });
    expect(result).toBe(false);
  });

  it('STRIPE-EVT-003: fail-open on unexpected DB errors (returns true to process)', async () => {
    mockInsert.mockResolvedValue({ error: { code: '08006', message: 'connection failure' } });
    const result = await claimStripeEvent({
      id: 'evt_3', type: 'x', livemode: false, data: {},
    });
    expect(result).toBe(true);
  });

  it('STRIPE-EVT-004: persists event metadata (id, type, livemode, api_version)', async () => {
    mockInsert.mockResolvedValue({ error: null });
    await claimStripeEvent({
      id: 'evt_4', type: 'customer.subscription.updated', livemode: true,
      api_version: '2024-12-15', data: { object: { id: 'sub_1', object: 'subscription' } },
    });
    const inserted = mockInsert.mock.calls[0][0];
    expect(inserted.id).toBe('evt_4');
    expect(inserted.type).toBe('customer.subscription.updated');
    expect(inserted.livemode).toBe(true);
    expect(inserted.api_version).toBe('2024-12-15');
    expect(inserted.raw_payload).toEqual({ id: 'sub_1', type: 'subscription' });
  });

  it('STRIPE-EVT-005: tolerates events with no data.object', async () => {
    mockInsert.mockResolvedValue({ error: null });
    await claimStripeEvent({ id: 'evt_5', type: 'x', livemode: false, data: {} });
    const inserted = mockInsert.mock.calls[0][0];
    expect(inserted.raw_payload).toBeNull();
  });
});

describe('markStripeEventProcessed', () => {
  let markStripeEventProcessed;

  beforeEach(async () => {
    mockInsert.mockReset();
    mockUpdate.mockReset();
    mockEq.mockReset();
    mockEq.mockResolvedValue({ error: null });
    const mod = await import('../services/stripeEvents.service.mjs');
    markStripeEventProcessed = mod.markStripeEventProcessed;
  });

  it('STRIPE-EVT-006: updates processed_at via .eq(id, ...)', async () => {
    await markStripeEventProcessed('evt_99');
    expect(mockUpdate).toHaveBeenCalledTimes(1);
    expect(mockEq).toHaveBeenCalledWith('id', 'evt_99');
    const updated = mockUpdate.mock.calls[0][0];
    expect(updated.processed_at).toMatch(/^\d{4}-\d{2}-\d{2}T/); // ISO 8601
    expect(updated.process_error).toBeNull();
  });

  it('STRIPE-EVT-007: stores process_error when given', async () => {
    await markStripeEventProcessed('evt_99', 'tier sync failed');
    expect(mockUpdate.mock.calls[0][0].process_error).toBe('tier sync failed');
  });

  it('STRIPE-EVT-008: swallows DB errors (does not throw)', async () => {
    mockEq.mockResolvedValue({ error: { message: 'connection lost' } });
    await expect(markStripeEventProcessed('evt_99')).resolves.toBeUndefined();
  });
});
