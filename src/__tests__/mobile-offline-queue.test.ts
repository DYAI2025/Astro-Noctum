/**
 * End-to-end test: offline quiz → queue → flush on reconnect.
 *
 * Implements: REQ-F-quiz-contribution-system (offline persistence AC)
 * Task: TASK-mobile-offline-e2e
 *
 * Tests the full flow:
 *   1. Complete a quiz while offline → queueContributionEvent persists locally
 *   2. Still offline → flushContributionQueue does NOT send (no-op)
 *   3. Network reconnects → flush sends all queued events to Supabase
 *   4. Deduplication: same (userId, moduleId) replaces previous entry
 *   5. Flush removes successfully sent events, retains failed ones
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Stub React Native / Expo modules that cannot run in Node
vi.mock('react-native', () => ({ Platform: { OS: 'ios' } }));
vi.mock('react-native-url-polyfill/auto', () => ({}));
vi.mock('expo-secure-store', () => ({}));
vi.mock('@supabase/supabase-js', () => ({ createClient: vi.fn(() => ({})) }));
vi.mock('../../apps/mobile/src/lib/config', () => ({
  assertMobileEnv: vi.fn(),
  mobileConfig: {
    supabaseUrl: 'https://test.supabase.co',
    supabaseAnonKey: 'test-key',
    apiBaseUrl: 'http://localhost',
  },
}));

// ── AsyncStorage mock — in-memory store ───────────────────────────────────────
const storage: Record<string, string> = {};
vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem:    vi.fn(async (key: string) => storage[key] ?? null),
    setItem:    vi.fn(async (key: string, value: string) => { storage[key] = value; }),
    removeItem: vi.fn(async (key: string) => { delete storage[key]; }),
    clear:      vi.fn(async () => { Object.keys(storage).forEach(k => delete storage[k]); }),
  },
}));

// ── NetInfo mock ──────────────────────────────────────────────────────────────
let mockIsConnected = false;
const netInfoListeners: Array<(state: { isConnected: boolean }) => void> = [];

vi.mock('@react-native-community/netinfo', () => ({
  default: {
    fetch: vi.fn(async () => ({ isConnected: mockIsConnected })),
    addEventListener: vi.fn((cb: (state: { isConnected: boolean }) => void) => {
      netInfoListeners.push(cb);
      return () => { netInfoListeners.splice(netInfoListeners.indexOf(cb), 1); };
    }),
  },
}));

// ── Supabase mock ─────────────────────────────────────────────────────────────
const upsertCalls: unknown[] = [];
let supabaseUpsertShouldFail = false;

vi.mock('../../apps/mobile/src/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      upsert: vi.fn(async (data: unknown) => {
        if (supabaseUpsertShouldFail) return { error: new Error('network error') };
        upsertCalls.push(data);
        return { error: null };
      }),
    })),
  },
}));

// ── Import queue module after all mocks ───────────────────────────────────────
import {
  queueContributionEvent,
  flushContributionQueue,
  getQueuedContributionCount,
  startQueueWorker,
  type QueuedContributionEvent,
} from '../../apps/mobile/src/lib/offlineQueue';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeEvent(overrides: Partial<QueuedContributionEvent> = {}): QueuedContributionEvent {
  return {
    userId: 'user-1',
    eventId: `event-${Date.now()}`,
    moduleId: 'naturkind_quiz_1',
    occurredAt: new Date().toISOString(),
    payload: { sector_weights: Array(12).fill(0.5), confidence: 0.75 },
    ...overrides,
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('offline quiz → queue → flush on reconnect', () => {
  beforeEach(() => {
    Object.keys(storage).forEach(k => delete storage[k]);
    upsertCalls.length = 0;
    mockIsConnected = false;
    supabaseUpsertShouldFail = false;
    netInfoListeners.length = 0;
  });

  it('queues event when quiz is completed offline', async () => {
    await queueContributionEvent(makeEvent());
    expect(await getQueuedContributionCount()).toBe(1);
  });

  it('stores event in AsyncStorage (persists across app restarts)', async () => {
    const event = makeEvent({ moduleId: 'mentalist_quiz_1' });
    await queueContributionEvent(event);

    const QUEUE_KEY = 'bazodiac_mobile_contribution_queue';
    expect(storage[QUEUE_KEY]).toBeDefined();
    const stored = JSON.parse(storage[QUEUE_KEY]) as QueuedContributionEvent[];
    expect(stored).toHaveLength(1);
    expect(stored[0].moduleId).toBe('mentalist_quiz_1');
  });

  it('flush is a no-op while offline', async () => {
    mockIsConnected = false;
    await queueContributionEvent(makeEvent());
    await flushContributionQueue();

    expect(upsertCalls).toHaveLength(0);
    expect(await getQueuedContributionCount()).toBe(1);
  });

  it('flush sends all queued events when online', async () => {
    mockIsConnected = true;
    await queueContributionEvent(makeEvent({ moduleId: 'naturkind_quiz_1' }));
    await queueContributionEvent(makeEvent({ moduleId: 'naturkind_quiz_2' }));

    await flushContributionQueue();

    expect(upsertCalls).toHaveLength(2);
    expect(await getQueuedContributionCount()).toBe(0);
  });

  it('deduplicates same (userId, moduleId) — last write wins', async () => {
    const first  = makeEvent({ moduleId: 'mystiker_quiz_1', payload: { sector_weights: Array(12).fill(0.3), confidence: 0.5 } });
    const second = makeEvent({ moduleId: 'mystiker_quiz_1', payload: { sector_weights: Array(12).fill(0.8), confidence: 0.9 } });

    await queueContributionEvent(first);
    await queueContributionEvent(second);

    expect(await getQueuedContributionCount()).toBe(1);

    mockIsConnected = true;
    await flushContributionQueue();

    expect(upsertCalls).toHaveLength(1);
    const sent = upsertCalls[0] as { payload: { confidence: number } };
    expect(sent.payload.confidence).toBe(0.9);
  });

  it('different moduleIds queue separately', async () => {
    await queueContributionEvent(makeEvent({ moduleId: 'quiz_a' }));
    await queueContributionEvent(makeEvent({ moduleId: 'quiz_b' }));
    expect(await getQueuedContributionCount()).toBe(2);
  });

  it('retains events in queue when Supabase upsert fails', async () => {
    mockIsConnected = true;
    supabaseUpsertShouldFail = true;
    await queueContributionEvent(makeEvent());

    await flushContributionQueue();

    expect(await getQueuedContributionCount()).toBe(1);
  });

  it('startQueueWorker triggers flush when network reconnects', async () => {
    await queueContributionEvent(makeEvent({ moduleId: 'stratege_quiz_1' }));

    const stop = startQueueWorker(60_000);

    mockIsConnected = true;
    netInfoListeners.forEach(cb => cb({ isConnected: true }));

    await new Promise(resolve => setTimeout(resolve, 50));

    expect(upsertCalls).toHaveLength(1);
    expect(await getQueuedContributionCount()).toBe(0);

    stop();
  });
});
