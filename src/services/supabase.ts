export interface PersistedReading {
  birth_input: {
    date: string;
    tz: string;
    lon: number;
    lat: number;
  };
  api_data: unknown;
  interpretation: string;
  api_issues: { endpoint: string; message: string }[];
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://ykoijifgweoapitabgxx.supabase.co";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

export function isSupabaseConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

/**
 * Persist a reading and return the row ID so ElevenLabs Levi can fetch it.
 */
export async function persistReading(reading: PersistedReading): Promise<number | null> {
  if (!isSupabaseConfigured()) {
    console.warn("Supabase is not configured. Skipping persistence.");
    return null;
  }

  const response = await fetch(`${SUPABASE_URL}/rest/v1/readings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      Prefer: "return=representation",
    },
    body: JSON.stringify(reading),
  });

  if (!response.ok) {
    const details = await response.text().catch(() => "No response body");
    throw new Error(`Failed to persist reading in Supabase: ${response.status} ${details}`);
  }

  const rows = await response.json();
  return rows?.[0]?.id ?? null;
}

/**
 * Fetch a persisted reading by ID (for Levi / external agents).
 */
export async function fetchReading(id: number) {
  if (!isSupabaseConfigured()) return null;

  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/readings?id=eq.${id}&select=*`,
    {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    },
  );

  if (!response.ok) return null;
  const rows = await response.json();
  return rows?.[0] ?? null;
}
