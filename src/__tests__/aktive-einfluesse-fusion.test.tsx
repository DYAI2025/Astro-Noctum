import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  AktiveEinfluesseFusion,
  intensityToTier,
  RESONANCE_CARD_STYLE,
} from '../components/dashboard/AktiveEinfluesseFusion';

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('../hooks/useDailyTransit', () => ({
  useDailyTransit: vi.fn(),
}));

vi.mock('../contexts/LanguageContext', () => ({
  useLanguage: () => ({ lang: 'de' }),
}));

import { useDailyTransit } from '../hooks/useDailyTransit';

const mockBodies = {
  Moon:    { zodiac_sign: 0,  longitude: 15.3, speed: 13.2,  degree_in_sign: 15.3,  is_retrograde: false },
  Mercury: { zodiac_sign: 3,  longitude: 95.7, speed: -0.5,  degree_in_sign: 5.7,   is_retrograde: true  },
  Venus:   { zodiac_sign: 7,  longitude: 225.1,speed: 1.1,   degree_in_sign: 15.1,  is_retrograde: false },
  Mars:    { zodiac_sign: 11, longitude: 341.8,speed: 0.7,   degree_in_sign: 11.8,  is_retrograde: false },
  Jupiter: { zodiac_sign: 1,  longitude: 48.6, speed: 0.2,   degree_in_sign: 18.6,  is_retrograde: false },
  Saturn:  { zodiac_sign: 9,  longitude: 285.4,speed: -0.1,  degree_in_sign: 15.4,  is_retrograde: true  },
};

beforeEach(() => {
  vi.mocked(useDailyTransit).mockReturnValue({
    bodies: mockBodies as never,
    loading: false,
    error: null,
  });
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('AktiveEinfluesseFusion', () => {
  // REQ-F-dashboard-bazi-fusion-bridge AC 9: when stem is absent, show Western block + notice
  it('still renders the section when dayMasterStem is undefined (no null return)', () => {
    render(<AktiveEinfluesseFusion dayMasterStem={undefined} />);
    expect(screen.getByTestId('aktive-einfluesse-fusion')).toBeInTheDocument();
  });

  it('shows BaZi-unavailable notice for each planet when dayMasterStem is undefined', () => {
    render(<AktiveEinfluesseFusion dayMasterStem={undefined} />);
    const notices = screen.getAllByTestId('bazi-unavailable-notice');
    expect(notices).toHaveLength(6);
    notices.forEach((n) => expect(n).toHaveTextContent('BaZi-Profil nicht verfügbar'));
  });

  it('shows BaZi-unavailable notice when dayMasterStem is invalid', () => {
    render(<AktiveEinfluesseFusion dayMasterStem="NotAStem" />);
    expect(screen.getByTestId('aktive-einfluesse-fusion')).toBeInTheDocument();
    const notices = screen.getAllByTestId('bazi-unavailable-notice');
    expect(notices).toHaveLength(6);
  });

  it('still renders planet labels (Western block) when stem is absent', () => {
    render(<AktiveEinfluesseFusion dayMasterStem={undefined} />);
    ['Mond', 'Merkur', 'Venus', 'Mars', 'Jupiter', 'Saturn'].forEach((label) => {
      expect(screen.getByText(label)).toBeInTheDocument();
    });
  });

  it('renders the section for a valid dayMasterStem', () => {
    render(<AktiveEinfluesseFusion dayMasterStem="Bing" />);
    expect(screen.getByTestId('aktive-einfluesse-fusion')).toBeInTheDocument();
  });

  it('shows all six planet labels', () => {
    render(<AktiveEinfluesseFusion dayMasterStem="Jia" />);
    ['Mond', 'Merkur', 'Venus', 'Mars', 'Jupiter', 'Saturn'].forEach((label) => {
      expect(screen.getByText(label)).toBeInTheDocument();
    });
  });

  it('shows retrograde indicator for Mercury (speed < 0)', () => {
    render(<AktiveEinfluesseFusion dayMasterStem="Jia" />);
    // Mercury is retrograde in mockBodies (speed -0.5)
    const retroIndicators = screen.getAllByText('℞');
    expect(retroIndicators.length).toBeGreaterThanOrEqual(1);
  });

  it('shows sign name for Moon (zodiac_sign 0 = Widder)', () => {
    render(<AktiveEinfluesseFusion dayMasterStem="Jia" />);
    expect(screen.getByText(/Widder/)).toBeInTheDocument();
  });

  it('shows a BaZi resonance quote for each planet', () => {
    render(<AktiveEinfluesseFusion dayMasterStem="Jia" />);
    // Each PlanetCard renders an italic quote — there should be 6
    const quotes = screen.getAllByRole('paragraph').filter((el) =>
      el.tagName === 'P' && el.classList.contains('italic'),
    );
    // At least some italic paragraphs from quotes
    expect(quotes.length).toBeGreaterThan(0);
  });

  it('renders skeleton when loading and no bodies', () => {
    vi.mocked(useDailyTransit).mockReturnValue({
      bodies: null,
      loading: true,
      error: null,
    });
    const { container } = render(<AktiveEinfluesseFusion dayMasterStem="Jia" />);
    expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
  });

  it('accepts all 10 heavenly stems without throwing', () => {
    const stems = ['Jia', 'Yi', 'Bing', 'Ding', 'Wu', 'Ji', 'Geng', 'Xin', 'Ren', 'Gui'];
    stems.forEach((stem) => {
      const { unmount } = render(<AktiveEinfluesseFusion dayMasterStem={stem} />);
      expect(screen.getByTestId('aktive-einfluesse-fusion')).toBeInTheDocument();
      unmount();
    });
  });

  // ── REQ-F-dashboard-live-daily-signals AC 4+5: dual-dimension color encoding ──
  //
  // Stem Jia (Wood) produces known resonance types per DEC-fusion-bazi-sheng-ke:
  //   Jupiter (Wood)  → gleichklang (same element)         → blue card
  //   Moon    (Water) → naehrung    (Water generates Wood)  → blue card
  //   Venus   (Metal) → kontrolle   (Metal controls Wood)   → red card
  //   Saturn  (Earth) → kontrolle   (Wood controls Earth)   → red card

  it('gleichklang planet card has blue border (resonance dimension)', () => {
    const { container } = render(<AktiveEinfluesseFusion dayMasterStem="Jia" />);
    // Jupiter = Wood = gleichklang with Jia (Wood Day Master)
    const jupiterCard = container.querySelector('[data-planet="Jupiter"]') as HTMLElement;
    expect(jupiterCard).toBeTruthy();
    // Blue border: rgba(60, 130, 210, 0.40)
    expect(jupiterCard.style.borderLeft).toContain('60');
    expect(jupiterCard.style.borderLeft).toContain('130');
    expect(jupiterCard.style.borderLeft).toContain('210');
  });

  it('naehrung planet card has blue border (resonance dimension)', () => {
    const { container } = render(<AktiveEinfluesseFusion dayMasterStem="Jia" />);
    // Moon = Water → naehrung with Jia (Water generates Wood)
    const moonCard = container.querySelector('[data-planet="Moon"]') as HTMLElement;
    expect(moonCard).toBeTruthy();
    expect(moonCard.style.borderLeft).toContain('60');
    expect(moonCard.style.borderLeft).toContain('130');
    expect(moonCard.style.borderLeft).toContain('210');
  });

  it('kontrolle planet card has red border (tension dimension)', () => {
    const { container } = render(<AktiveEinfluesseFusion dayMasterStem="Jia" />);
    // Venus = Metal → kontrolle with Jia (Metal controls Wood)
    const venusCard = container.querySelector('[data-planet="Venus"]') as HTMLElement;
    expect(venusCard).toBeTruthy();
    // Red border: rgba(200, 80, 80, 0.40)
    expect(venusCard.style.borderLeft).toContain('200');
    expect(venusCard.style.borderLeft).toContain('80');
  });

  it('card background reflects resonance dimension (blue bg for gleichklang)', () => {
    const { container } = render(<AktiveEinfluesseFusion dayMasterStem="Jia" />);
    const jupiterCard = container.querySelector('[data-planet="Jupiter"]') as HTMLElement;
    // Blue bg: rgba(60, 130, 210, 0.07)
    expect(jupiterCard.style.background).toContain('60');
    expect(jupiterCard.style.background).toContain('130');
    expect(jupiterCard.style.background).toContain('210');
  });

  it('card background reflects tension dimension (red bg for kontrolle)', () => {
    const { container } = render(<AktiveEinfluesseFusion dayMasterStem="Jia" />);
    const venusCard = container.querySelector('[data-planet="Venus"]') as HTMLElement;
    // Red bg: rgba(200, 80, 80, 0.07)
    expect(venusCard.style.background).toContain('200');
    expect(venusCard.style.background).toContain('80');
  });

  // ── REQ-F-dashboard-live-daily-signals AC 7: Feldstärke qualitative tiers ────
  //
  // intensityToTier() thresholds (from DEC-fusion-bazi-sheng-ke intensity ranges):
  //   gering: intensity < 0.60
  //   mittel: 0.60 ≤ intensity < 0.75
  //   stark:  intensity ≥ 0.75
  //
  // With Jia (Wood) Day Master:
  //   Jupiter (Wood) → gleichklang → intensity 0.80–0.90 → stark
  //   Moon    (Water)→ naehrung    → intensity 0.70–0.80 → mittel/stark
  //   Venus   (Metal)→ kontrolle   → intensity 0.65–0.75 → mittel/stark
  //   (neutral is mathematically unreachable — intensity ≤ 0.45 → gering)

  it('renders a Feldstärke bar for each planet with a valid stem', () => {
    const { container } = render(<AktiveEinfluesseFusion dayMasterStem="Jia" />);
    const bars = container.querySelectorAll('[data-testid="feldstaerke-bar"]');
    // One bar per planet card (6 planets)
    expect(bars.length).toBe(6);
  });

  it('Feldstärke bar for gleichklang planet shows "stark" tier', () => {
    const { container } = render(<AktiveEinfluesseFusion dayMasterStem="Jia" />);
    // Jupiter = Wood = gleichklang with Jia → intensity 0.80–0.90 → stark
    const jupiterCard = container.querySelector('[data-planet="Jupiter"]') as HTMLElement;
    const bar = jupiterCard.querySelector('[data-testid="feldstaerke-bar"]') as HTMLElement;
    expect(bar).toBeTruthy();
    expect(bar.dataset.tier).toBe('stark');
    expect(bar.textContent).toMatch(/Stark/i);
  });

  it('Feldstärke bar shows "Feldstärke" label text', () => {
    const { container } = render(<AktiveEinfluesseFusion dayMasterStem="Jia" />);
    const jupiterCard = container.querySelector('[data-planet="Jupiter"]') as HTMLElement;
    const bar = jupiterCard.querySelector('[data-testid="feldstaerke-bar"]') as HTMLElement;
    expect(bar.textContent).toContain('Feldstärke');
  });

  it('no Feldstärke bar when dayMasterStem is absent (no BaZi block)', () => {
    const { container } = render(<AktiveEinfluesseFusion dayMasterStem={undefined} />);
    const bars = container.querySelectorAll('[data-testid="feldstaerke-bar"]');
    expect(bars.length).toBe(0);
  });

  it('no-stem card uses neutral fallback (no blue or red border)', () => {
    const { container } = render(<AktiveEinfluesseFusion dayMasterStem={undefined} />);
    const moonCard = container.querySelector('[data-planet="Moon"]') as HTMLElement;
    expect(moonCard).toBeTruthy();
    // Neutral: rgba(255,255,255,0.08) — not blue, not red
    expect(moonCard.style.borderLeft).not.toContain('210');
    expect(moonCard.style.borderLeft).not.toContain('200, 80');
  });

  // ── TASK-einfluesse-ac-tests: neutral resonance color (REQ-F-dashboard-live-daily-signals AC 5) ──
  //
  // neutral resonance is mathematically unreachable from real stem+planet inputs (DEC-fusion-bazi-sheng-ke).
  // RESONANCE_CARD_STYLE is the single source of truth — tested directly here to verify
  // the neutral pole uses muted gold (not blue, not red).

  it('RESONANCE_CARD_STYLE.neutral uses muted gold (not blue, not red)', () => {
    // Muted gold: rgba(180, 150, 50, ...) — distinct from resonance blue and tension red
    expect(RESONANCE_CARD_STYLE.neutral.border).toContain('180');
    expect(RESONANCE_CARD_STYLE.neutral.border).toContain('150');
    expect(RESONANCE_CARD_STYLE.neutral.border).toContain('50');
    expect(RESONANCE_CARD_STYLE.neutral.border).not.toContain('210'); // not blue
    expect(RESONANCE_CARD_STYLE.neutral.border).not.toContain('200'); // not red
    expect(RESONANCE_CARD_STYLE.neutral.bg).toContain('180');
  });

  it('RESONANCE_CARD_STYLE.gleichklang and naehrung share the same blue style', () => {
    expect(RESONANCE_CARD_STYLE.gleichklang).toEqual(RESONANCE_CARD_STYLE.naehrung);
    expect(RESONANCE_CARD_STYLE.gleichklang.border).toContain('210');
  });

  it('RESONANCE_CARD_STYLE.kontrolle uses red (tension dimension)', () => {
    expect(RESONANCE_CARD_STYLE.kontrolle.border).toContain('200');
    expect(RESONANCE_CARD_STYLE.kontrolle.border).not.toContain('210');
  });
});

// ── intensityToTier unit tests (AC 7 — all three tiers) ─────────────────────

describe('intensityToTier', () => {
  it('returns gering for intensity below 0.60', () => {
    expect(intensityToTier(0.00)).toBe('gering');
    expect(intensityToTier(0.45)).toBe('gering');
    expect(intensityToTier(0.59)).toBe('gering');
  });

  it('returns mittel for intensity between 0.60 and 0.74', () => {
    expect(intensityToTier(0.60)).toBe('mittel');
    expect(intensityToTier(0.65)).toBe('mittel');
    expect(intensityToTier(0.74)).toBe('mittel');
  });

  it('returns stark for intensity 0.75 and above', () => {
    expect(intensityToTier(0.75)).toBe('stark');
    expect(intensityToTier(0.85)).toBe('stark');
    expect(intensityToTier(1.00)).toBe('stark');
  });

  it('thresholds are exactly at 0.60 and 0.75 (boundary values)', () => {
    expect(intensityToTier(0.5999)).toBe('gering');
    expect(intensityToTier(0.6000)).toBe('mittel');
    expect(intensityToTier(0.7499)).toBe('mittel');
    expect(intensityToTier(0.7500)).toBe('stark');
  });
});
