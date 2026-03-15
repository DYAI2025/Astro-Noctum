import { supabase } from '@/src/lib/supabase';

/**
 * Fire-and-forget: persist quiz sector weights to Supabase via server proxy.
 * Never throws — logs errors silently. Must not block user flow.
 */
export async function contributeQuizResult(
  source: string,
  sectorWeights: number[],
  confidence = 0.7,
): Promise<void> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      console.warn('[contribute] no session, skipping');
      return;
    }

    const res = await fetch('/api/contribute', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        source,
        sector_weights: sectorWeights,
        confidence,
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      console.warn('[contribute] failed:', res.status, body);
    }
  } catch (err) {
    console.warn('[contribute] network error:', (err as Error).message);
  }
}
