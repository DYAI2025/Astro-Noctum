import { supabase } from '@/src/lib/supabase';
import type { ContributionEvent } from '@/src/lib/lme/types';

/**
 * Speichere ein ContributionEvent in Supabase.
 * Fire-and-forget Pattern (wie bestehende Supabase-Calls in der App).
 */
export async function saveContributionEvent(
  event: ContributionEvent,
  userId?: string,
): Promise<void> {
  try {
    const row = {
      user_id: userId ?? null,
      event_id: event.eventId,
      module_id: event.source.moduleId,
      occurred_at: event.occurredAt,
      payload: event.payload,
    };

    const { error } = userId
      ? await supabase
          .from('contribution_events')
          .upsert(row, { onConflict: 'user_id,module_id' })
      : await supabase
          .from('contribution_events')
          .insert(row);

    if (error) {
      console.warn('Failed to save contribution event:', error.message);
    }
  } catch (err) {
    console.warn('Contribution event save failed:', err);
  }
}

/**
 * Lade alle Events eines Users.
 * Gibt sie als ContributionEvent[] zurück, rekonstruiert aus der DB.
 */
export async function loadUserEvents(userId: string): Promise<ContributionEvent[]> {
  try {
    const { data, error } = await supabase
      .from('contribution_events')
      .select('*')
      .eq('user_id', userId)
      .order('occurred_at', { ascending: true });

    if (error || !data) return [];

    return data.map(row => ({
      specVersion: 'sp.contribution.v1' as const,
      eventId: row.event_id,
      occurredAt: row.occurred_at,
      userRef: row.user_id,
      source: {
        vertical: 'quiz' as const,
        moduleId: row.module_id,
      },
      payload: row.payload,
    }));
  } catch {
    return [];
  }
}
