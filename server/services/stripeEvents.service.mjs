import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'http://localhost',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder',
);

/**
 * Try to claim a Stripe event for processing. Returns:
 *   - `true`  if this is the first sighting (caller should proceed).
 *   - `false` if the event has already been claimed (caller should
 *             return 200 OK without re-running side effects).
 *
 * Race-safe via the table's PRIMARY KEY on event.id. Concurrent claims
 * for the same event ID will resolve to one INSERT success and N
 * unique-violation rejections.
 *
 * Fail-open policy: if Supabase is unreachable or returns an unexpected
 * error, we return `true` so the webhook continues processing. Better
 * to double-process than to silently drop a real event — Stripe's
 * dashboard remains the source of truth, and the webhook side-effects
 * (tier=premium, etc.) are themselves idempotent.
 */
export async function claimStripeEvent(event) {
  const payloadObj = event?.data?.object;
  const { error } = await supabase
    .from('stripe_events')
    .insert({
      id: event.id,
      type: event.type,
      livemode: event.livemode,
      api_version: event.api_version ?? null,
      raw_payload: payloadObj
        ? { id: payloadObj.id, type: payloadObj.object }
        : null,
    });

  if (!error) return true;
  // 23505 = unique_violation — the event is already in the log.
  if (error.code === '23505') return false;
  console.error('[stripeEvents] claim failed (fail-open):', error.message);
  return true;
}

/**
 * Mark an event as fully processed (or processed-with-error).
 *
 * Errors are swallowed and logged: a failed mark must not block the
 * 200 OK to Stripe, otherwise Stripe retries and we re-claim, then
 * re-fail to mark, then retry forever. The processed_at gap is a
 * monitoring concern, not a correctness one — claimStripeEvent
 * dedupes by event ID regardless of processed_at state.
 */
export async function markStripeEventProcessed(eventId, processError = null) {
  const { error } = await supabase
    .from('stripe_events')
    .update({
      processed_at: new Date().toISOString(),
      process_error: processError,
    })
    .eq('id', eventId);
  if (error) {
    console.error('[stripeEvents] mark-processed failed:', error.message);
  }
}
