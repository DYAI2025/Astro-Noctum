/**
 * DONKI Extended Backend
 *
 * Extends existing DONKI coverage (FLR + GST) with:
 * - CMEAnalysis: earthbound CME detection via enlilList isEarthTargeted
 * - SEP: solar energetic particle events
 * - HSS: high speed stream events
 * - Notifications: Warning/Watch alert strings
 */

import type { SpaceWeatherContribution, SpaceWeatherSeverity } from './types';

// ---------------------------------------------------------------------------
// DONKI raw response types
// ---------------------------------------------------------------------------

interface EnlilEntry {
  isEarthGB?: boolean;
  au?: number;
  estimatedShockArrivalTime?: string | null;
  kp_18?: number | null;
  kp_90?: number | null;
  kp_135?: number | null;
  kp_180?: number | null;
  isEarthTargeted?: boolean;
}

interface CMEAnalysis {
  isMostAccurate: boolean;
  enlilList?: EnlilEntry[] | null;
}

interface CMEEvent {
  activityID: string;
  startTime: string;
  cmeAnalyses?: CMEAnalysis[] | null;
}

interface SEPEvent {
  sepID: string;
  eventTime: string;
}

interface HSSEvent {
  hssID: string;
  eventTime: string;
}

interface NotificationEvent {
  messageID: string;
  messageType: string;
  messageBody: string;
  messageIssueTime: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getApiKey(): string {
  return (
    (typeof process !== 'undefined' && process.env?.NASA_API_KEY) ||
    (typeof process !== 'undefined' && process.env?.VITE_NASA_API_KEY) ||
    'DEMO_KEY'
  );
}

async function fetchDONKI<T>(
  endpoint: string,
  startDate: string,
  endDate: string,
): Promise<T[]> {
  const apiKey = getApiKey();
  const url = `https://api.nasa.gov/DONKI/${endpoint}?startDate=${startDate}&endDate=${endDate}&api_key=${apiKey}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  } finally {
    clearTimeout(timeout);
  }
}

/** Maps Kp index to NOAA G-scale severity */
function kpToGScale(kp: number): SpaceWeatherSeverity {
  if (kp >= 9) return 'G5';
  if (kp >= 8) return 'G4';
  if (kp >= 7) return 'G3';
  if (kp >= 6) return 'G2';
  if (kp >= 5) return 'G1';
  return 'G0';
}

/** Severity weight lookup — capped at 0.5 */
const SEVERITY_WEIGHTS: Record<string, number> = {
  G0: 0.05,
  G1: 0.10,
  G2: 0.20,
  G3: 0.30,
  G4: 0.40,
  G5: 0.50,
  S1: 0.10,
  S2: 0.20,
  S3: 0.30,
  S4: 0.40,
  S5: 0.50,
  R1: 0.08,
  R2: 0.16,
  R3: 0.24,
  R4: 0.32,
  R5: 0.50,
};

function signatureWeight(severity: SpaceWeatherSeverity): number {
  const w = SEVERITY_WEIGHTS[severity] ?? 0.05;
  return Math.min(0.5, w);
}

function hoursFromNow(hours: number): string {
  return new Date(Date.now() + hours * 3600_000).toISOString();
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------------
// Parsers
// ---------------------------------------------------------------------------

function parseCMEContributions(cmes: CMEEvent[]): SpaceWeatherContribution[] {
  const contributions: SpaceWeatherContribution[] = [];

  for (const cme of cmes) {
    if (!cme.cmeAnalyses) continue;

    for (const analysis of cme.cmeAnalyses) {
      if (!analysis.isMostAccurate || !analysis.enlilList) continue;

      for (const enlil of analysis.enlilList) {
        if (!enlil.isEarthTargeted) continue;

        // Extract best Kp estimate from the four quadrants
        const kpValues = [enlil.kp_18, enlil.kp_90, enlil.kp_135, enlil.kp_180].filter(
          (v): v is number => v != null,
        );
        const maxKp = kpValues.length > 0 ? Math.max(...kpValues) : 0;
        const severity = kpToGScale(maxKp);

        contributions.push({
          schema: 'sp.contribution.v1',
          event_id: `donki-cme-${cme.activityID}`,
          type: 'cme_arrival',
          severity,
          signature_weight: signatureWeight(severity),
          source_event_id: cme.activityID,
          started_at: cme.startTime,
          expires_at: enlil.estimatedShockArrivalTime ?? hoursFromNow(72),
          description: `Earthbound CME detected (est. Kp ${maxKp.toFixed(1)})`,
        });
      }
    }
  }

  return contributions;
}

function parseSEPContributions(seps: SEPEvent[]): SpaceWeatherContribution[] {
  return seps.map((sep) => ({
    schema: 'sp.contribution.v1' as const,
    event_id: `donki-sep-${sep.sepID}`,
    type: 'sep' as const,
    severity: 'S1' as SpaceWeatherSeverity,
    signature_weight: signatureWeight('S1'),
    source_event_id: sep.sepID,
    started_at: sep.eventTime,
    expires_at: hoursFromNow(24),
    description: 'Solar energetic particle event',
  }));
}

function parseHSSContributions(hss: HSSEvent[]): SpaceWeatherContribution[] {
  return hss.map((h) => ({
    schema: 'sp.contribution.v1' as const,
    event_id: `donki-hss-${h.hssID}`,
    type: 'hss' as const,
    severity: 'G1' as SpaceWeatherSeverity,
    signature_weight: signatureWeight('G1'),
    source_event_id: h.hssID,
    started_at: h.eventTime,
    expires_at: hoursFromNow(48),
    description: 'High speed stream event',
  }));
}

function parseAlerts(notifications: NotificationEvent[]): string[] {
  return notifications
    .filter(
      (n) =>
        n.messageType === 'Warning' || n.messageType === 'Watch',
    )
    .slice(-5)
    .map((n) =>
      n.messageBody.length > 200
        ? n.messageBody.slice(0, 200)
        : n.messageBody,
    );
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface DonkiExtendedResult {
  contributions: SpaceWeatherContribution[];
  alerts: string[];
}

export async function fetchDonkiExtended(
  lookbackDays = 7,
): Promise<DonkiExtendedResult> {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - lookbackDays);

  const start = formatDate(startDate);
  const end = formatDate(endDate);

  const [cmeResult, sepResult, hssResult, notifResult] =
    await Promise.allSettled([
      fetchDONKI<CMEEvent>('CME', start, end),
      fetchDONKI<SEPEvent>('SEP', start, end),
      fetchDONKI<HSSEvent>('HSS', start, end),
      fetchDONKI<NotificationEvent>('notifications', start, end),
    ]);

  const cmes = cmeResult.status === 'fulfilled' ? cmeResult.value : [];
  const seps = sepResult.status === 'fulfilled' ? sepResult.value : [];
  const hssList = hssResult.status === 'fulfilled' ? hssResult.value : [];
  const notifications =
    notifResult.status === 'fulfilled' ? notifResult.value : [];

  const contributions: SpaceWeatherContribution[] = [
    ...parseCMEContributions(cmes),
    ...parseSEPContributions(seps),
    ...parseHSSContributions(hssList),
  ];

  const alerts = parseAlerts(notifications);

  return { contributions, alerts };
}
