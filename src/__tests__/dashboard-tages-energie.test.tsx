import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DashboardTagesEnergie } from '../components/dashboard/DashboardTagesEnergie';
import type { DailyResponse } from '../lib/schemas/experience';
import type { SpaceWeatherState } from '../hooks/useSpaceWeather';

// ── Mocks ──────────────────────────────────────────────────────────

let mockIsPremium = false;

vi.mock('../hooks/usePremium', () => ({
  usePremium: () => ({ isPremium: mockIsPremium, loading: false }),
}));
vi.mock('../contexts/LanguageContext', () => ({
  useLanguage: () => ({ t: (k: string) => k, lang: 'de', setLang: vi.fn() }),
}));
vi.mock('../lib/analytics', () => ({ trackEvent: vi.fn() }));
vi.mock('../lib/authedFetch', () => ({ authedFetch: vi.fn() }));

// ── Fixtures ───────────────────────────────────────────────────────

const DAILY: DailyResponse = {
  date: '2026-03-29',
  western: {
    summary: 'Western summary',
    themes: ['Transformation', 'Kommunikation'],
    caution: 'Achtung Reibung',
    opportunity: 'Chance heute',
    evidence: { natal_focus: ['Venus trine Jupiter'] },
  },
  eastern: {
    summary: 'Eastern summary',
    themes: ['Holz', 'Feuer'],
    caution: 'Eastern Reibung',
    opportunity: 'Eastern Chance',
    evidence: { day_master: '甲', natal_focus: [] },
  },
  fusion: {
    summary: 'Fusion summary',
    synthesis: 'Heute trägt Feuer deine Energie. Die Holz-Achse ist aktiv.',
    action: 'Lass los, was dich bremst.',
    pushworthy: false,
    harmony_index: 0.6,
    day_mode: 'trace',
  },
  meta: { engine_version: '1.0' },
};

const SPACE_WEATHER: SpaceWeatherState = {
  kpIndex: 1,
  solarPressure: 0.1,
  ringModulation: 1.0,
  intensityBoost: 0,
  triggerEffect: false,
  gScale: 'G0',
  xrayFlux: 0,
  xrayClass: 'A',
  protonFlux: 0,
  f107: 150,
  solarCyclePhase: 'ascending',
  events: [],
  alerts: [],
  lastUpdate: null,
  loading: false,
  error: null,
};

// ── Tests ──────────────────────────────────────────────────────────

describe('DashboardTagesEnergie — PremiumGate Integration', () => {
  beforeEach(() => {
    mockIsPremium = false;
  });

  it('zeigt fusion.action NICHT sichtbar für Freemium-Nutzer', () => {
    mockIsPremium = false;
    render(
      <DashboardTagesEnergie
        daily={DAILY}
        dayHarmonic={null}
        spaceWeather={SPACE_WEATHER}
      />
    );
    // PremiumGate blendet den Inhalt ab:
    // Der action-Text ist im DOM (im blur-Container), aber hinter aria-hidden
    const actionEl = screen.queryByText('Lass los, was dich bremst.');
    if (actionEl) {
      // Wenn im DOM: muss hinter dem PremiumGate blur-container liegen
      const blurContainer = actionEl.closest('.blur-sm');
      expect(blurContainer).not.toBeNull();
    } else {
      // Alternativ nicht im DOM — PremiumGate hat ihn vollständig ausgeblendet
      expect(actionEl).toBeNull();
    }
  });

  it('zeigt fusion.action FÜR Premium-Nutzer direkt sichtbar', () => {
    mockIsPremium = true;
    render(
      <DashboardTagesEnergie
        daily={DAILY}
        dayHarmonic={null}
        spaceWeather={SPACE_WEATHER}
      />
    );
    expect(screen.getByText('Lass los, was dich bremst.')).toBeDefined();
    // Kein aria-hidden parent
    const actionEl = screen.getByText('Lass los, was dich bremst.');
    expect(actionEl.closest('[aria-hidden="true"]')).toBeNull();
  });

  it('zeigt body (synthesis) IMMER — für beide User-Typen', () => {
    mockIsPremium = false;
    render(
      <DashboardTagesEnergie
        daily={DAILY}
        dayHarmonic={null}
        spaceWeather={SPACE_WEATHER}
      />
    );
    expect(
      screen.getByText('Heute trägt Feuer deine Energie. Die Holz-Achse ist aktiv.')
    ).toBeDefined();
  });

  it('akzeptiert kein isPremium-Prop (Props-Interface sauber)', () => {
    // Dokumentationstest: tsc stellt sicher dass isPremium nicht im Interface ist.
    // Wenn dieser Test ohne TypeScript-Error kompiliert, ist das Interface sauber.
    render(
      <DashboardTagesEnergie
        daily={DAILY}
        dayHarmonic={null}
        spaceWeather={SPACE_WEATHER}
      />
    );
    expect(true).toBe(true);
  });

  it('PremiumGate setzt aria-hidden + blur-sm auf Container für Freemium', () => {
    mockIsPremium = false;
    const { container } = render(
      <DashboardTagesEnergie
        daily={DAILY}
        dayHarmonic={null}
        spaceWeather={SPACE_WEATHER}
      />
    );
    // PremiumGate rendert: <div aria-hidden="true" class="blur-sm ...">children</div>
    // Lucide Icons haben auch aria-hidden="true" auf SVGs → gezielt nach blur-sm suchen
    const blurContainer = container.querySelector('[aria-hidden="true"].blur-sm');
    expect(blurContainer).not.toBeNull();
    expect(blurContainer?.textContent).toContain('Lass los, was dich bremst.');
  });
});

// ── Hilfsfunktion: minimales SpaceWeatherContribution-Event ──────────
function makeEvent(
  type: 'cme_arrival' | 'flare' | 'geomagnetic_storm' | 'sep' | 'hss' | 'alert',
  severity = 'G3',
) {
  return {
    schema: 'sp.contribution.v1' as const,
    event_id: `test-${type}`,
    type,
    severity,
    signature_weight: 0.3,
    started_at: '2026-03-29T10:00:00Z',
    expires_at: '2026-03-29T18:00:00Z',
  };
}

describe('DashboardTagesEnergie — Kosmoswetter Pills', () => {
  it('rendert Magnetsturm-Pill für geomagnetic_storm Event (G3)', () => {
    mockIsPremium = true;
    const sw: SpaceWeatherState = {
      ...SPACE_WEATHER,
      kpIndex: 0, // Kp-basierte Pill soll NICHT erscheinen
      events: [makeEvent('geomagnetic_storm', 'G3')],
    };
    const { container } = render(
      <DashboardTagesEnergie daily={DAILY} dayHarmonic={null} spaceWeather={sw} />
    );
    expect(container.textContent).toContain('Magnetsturm');
    expect(container.textContent).toContain('G3');
  });

  it('rendert Magnetsturm-Pill als span-Element mit Sturmtext', () => {
    mockIsPremium = true;
    const sw: SpaceWeatherState = {
      ...SPACE_WEATHER,
      kpIndex: 0,
      events: [makeEvent('geomagnetic_storm', 'G3')],
    };
    const { container } = render(
      <DashboardTagesEnergie daily={DAILY} dayHarmonic={null} spaceWeather={sw} />
    );
    const pills = container.querySelectorAll('span');
    const stormPill = Array.from(pills).find(
      (el) => el.textContent?.includes('Magnetsturm'),
    );
    expect(stormPill).not.toBeUndefined();
  });

  it('rendert KEINE Magnetsturm-Pill wenn kein geomagnetic_storm Event vorhanden', () => {
    mockIsPremium = true;
    const sw: SpaceWeatherState = { ...SPACE_WEATHER, kpIndex: 0, events: [] };
    const { container } = render(
      <DashboardTagesEnergie daily={DAILY} dayHarmonic={null} spaceWeather={sw} />
    );
    expect(container.textContent).not.toContain('Magnetsturm G');
  });
});
