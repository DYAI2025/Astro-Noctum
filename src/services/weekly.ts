import { authedFetch } from '../lib/authedFetch';

// ── Types ────────────────────────────────────────────────────────────

export interface WeeklyArea {
  key: string;
  label: { de: string; en: string };
  statement: string;
  tendency: string;
  score: number;
  rank: number;
  isHighlighted: boolean;
  explain: string;
}

export interface WeeklyResponse {
  week: string;
  areas: WeeklyArea[];
  meta: { engine_version: string; cached: boolean };
}

// ── API Client ───────────────────────────────────────────────────────

export async function fetchWeeklyInsights(userId: string): Promise<WeeklyResponse> {
  const res = await authedFetch('/api/weekly-insights', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  });
  if (!res.ok) throw new Error('weekly_insights_unavailable');
  return res.json();
}
