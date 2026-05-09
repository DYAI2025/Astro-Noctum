/**
 * Tests for TagespulsCard — Phase E component.
 *
 * The most important tests here are TPC-003 / TPC-004: they prove that
 * when slot_2 or slot_3 are null in the server response, the rendered
 * DOM contains ZERO substituted placeholder text. The no-placeholders
 * directive is the central acceptance criterion of this phase.
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { DailyPulseResponse, DailyInterpretation } from '@/src/lib/schemas/daily-pulse';
import type { DailyPulseError } from '@/src/hooks/useDailyPulse';

// ── Mock the language context to a fixed German locale, surfacing keys
//    via `t()` so we can assert on stable strings without depending on
//    the live translations file.

vi.mock('@/src/contexts/LanguageContext', () => ({
  useLanguage: () => ({ lang: 'de', t: (k: string) => k }),
}));

// ── Mock the hook so each test owns the state it cares about ────────────
const useDailyPulseMock = vi.fn();
vi.mock('@/src/hooks/useDailyPulse', () => ({
  useDailyPulse: () => useDailyPulseMock(),
}));

import { TagespulsCard } from '../components/dashboard/TagespulsCard';

// ── Fixtures ─────────────────────────────────────────────────────────────
const COUNCIL: DailyPulseResponse['council'] = [
  { key: 'sonne', displayName: 'Sonne', signOrElement: 'Taurus' },
  { key: 'mond', displayName: 'Mond', signOrElement: 'Libra' },
  { key: 'aszendent', displayName: 'Aszendent', signOrElement: 'Libra' },
  { key: 'day_master', displayName: 'Day-Master', signOrElement: 'Ding' },
  { key: 'jahrestier', displayName: 'Jahrestier', signOrElement: 'Dog' },
  { key: 'wuxing_dom', displayName: 'Wu-Xing dominant', signOrElement: 'Holz' },
];

const FULL_PULSE: DailyPulseResponse = {
  id: 'pulse-1',
  user_id: 'user-1',
  date: '2026-05-09',
  locale: 'de',
  mode: 'pulse',
  intensity: 0.4,
  harmony_index: 0.6,
  aphorism: {
    id: 'aph-1',
    author: 'Marcus Aurelius',
    attribution_status: 'verified',
    slot_1: 'Die Tage fließen, und nichts hält still.',
    slot_2: 'Du sitzt am Schreibtisch, der Kaffee dampft, und ein Gedanke schiebt sich vor.',
    slot_3: 'Schreib einen Satz auf, der den Tag öffnet.',
  },
  council: COUNCIL,
  weather_stale: false,
};

interface HookOverrides {
  pulse?: DailyPulseResponse | null;
  loading?: boolean;
  error?: DailyPulseError | null;
  selectedFigure?: string | null;
  interpretation?: DailyInterpretation | null;
  loadingInterpretation?: boolean;
  interpretationError?: DailyPulseError | null;
  refresh?: () => void;
  selectCouncilFigure?: (k: string) => void;
}

function setHookState(overrides: HookOverrides = {}) {
  useDailyPulseMock.mockReturnValue({
    pulse: FULL_PULSE,
    loading: false,
    error: null,
    refresh: vi.fn(),
    selectedFigure: null,
    interpretation: null,
    loadingInterpretation: false,
    interpretationError: null,
    selectCouncilFigure: vi.fn(),
    ...overrides,
  });
}

beforeEach(() => {
  useDailyPulseMock.mockReset();
});

afterEach(() => {
  vi.clearAllMocks();
});

// ── Forbidden placeholder strings (must NEVER appear in the rendered DOM
//    for null slots — these are the regression anchors for the
//    no-placeholders directive). ─────────────────────────────────────────
const FORBIDDEN_PLACEHOLDER_STRINGS = [
  'Heute fließt deine Energie',
  'Heute fließt',
  'Today your energy flows',
  'Nutze diese ruhige Phase',
  'Use this calm phase',
];

function assertNoForbiddenPlaceholders(container: HTMLElement) {
  const text = container.textContent ?? '';
  for (const s of FORBIDDEN_PLACEHOLDER_STRINGS) {
    expect(text.includes(s)).toBe(false);
  }
}

// ── Tests ────────────────────────────────────────────────────────────────
describe('TagespulsCard', () => {
  it('TPC-001: loading state renders skeleton', () => {
    setHookState({ pulse: null, loading: true });
    render(<TagespulsCard />);
    expect(screen.getByTestId('tagespuls-card-skeleton')).toBeTruthy();
  });

  it('TPC-002: real data renders aphorism + author + slot_2 + slot_3 + 6 council buttons', () => {
    setHookState({ pulse: FULL_PULSE });
    const { container } = render(<TagespulsCard />);

    // Aphorism + author
    expect(container.textContent).toContain(FULL_PULSE.aphorism.slot_1);
    expect(container.textContent).toContain('Marcus Aurelius');

    // Slot 2 and 3 visible
    expect(screen.getByTestId('tagespuls-bridge')).toBeTruthy();
    expect(screen.getByTestId('tagespuls-impulse')).toBeTruthy();
    expect(container.textContent).toContain(FULL_PULSE.aphorism.slot_2);
    expect(container.textContent).toContain(FULL_PULSE.aphorism.slot_3);

    // 6 council buttons rendered
    const buttons = container.querySelectorAll('[data-figure-key]');
    expect(buttons).toHaveLength(6);
  });

  it('TPC-003: slot_2 = null → bridge section omitted, NO placeholder text leaks', () => {
    setHookState({
      pulse: {
        ...FULL_PULSE,
        aphorism: { ...FULL_PULSE.aphorism, slot_2: null },
      },
    });
    const { container } = render(<TagespulsCard />);

    // The bridge subsection is entirely absent.
    expect(screen.queryByTestId('tagespuls-bridge')).toBeNull();
    // The bridge label key is NOT rendered.
    expect(container.textContent).not.toContain('tagespuls.bridge');
    // The slot_3 section is unaffected — still rendered.
    expect(screen.getByTestId('tagespuls-impulse')).toBeTruthy();
    // Aphorism is still visible.
    expect(container.textContent).toContain(FULL_PULSE.aphorism.slot_1);
    // No fallback strings.
    assertNoForbiddenPlaceholders(container);
  });

  it('TPC-004: both slots null → aphorism alone, NO labels, NO fallback', () => {
    setHookState({
      pulse: {
        ...FULL_PULSE,
        aphorism: { ...FULL_PULSE.aphorism, slot_2: null, slot_3: null },
      },
    });
    const { container } = render(<TagespulsCard />);

    expect(screen.queryByTestId('tagespuls-bridge')).toBeNull();
    expect(screen.queryByTestId('tagespuls-impulse')).toBeNull();
    expect(container.textContent).not.toContain('tagespuls.bridge');
    expect(container.textContent).not.toContain('tagespuls.impulse');

    // Aphorism + council still visible — the curated foundation is
    // never suppressed, only the LLM-generated slots can be.
    expect(container.textContent).toContain(FULL_PULSE.aphorism.slot_1);
    expect(screen.getByTestId('tagespuls-council')).toBeTruthy();

    assertNoForbiddenPlaceholders(container);
  });

  it('TPC-005: profile_required state renders CTA + button', () => {
    const onComplete = vi.fn();
    setHookState({
      pulse: null,
      error: { code: 'profile_required' },
    });

    render(<TagespulsCard onCompleteProfile={onComplete} />);

    expect(screen.getByTestId('tagespuls-profile-required')).toBeTruthy();
    const btn = screen.getByText('tagespuls.errors.profileCta');
    fireEvent.click(btn);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('TPC-006: network error renders retry button + click triggers refresh', () => {
    const refresh = vi.fn();
    setHookState({
      pulse: null,
      error: { code: 'network' },
      refresh,
    });

    render(<TagespulsCard />);
    expect(screen.getByTestId('tagespuls-error-retry')).toBeTruthy();

    const retryBtn = screen.getByText('tagespuls.errors.retry');
    fireEvent.click(retryBtn);
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it('TPC-007: phase 2 — selected figure shows interpretation text', () => {
    setHookState({
      pulse: FULL_PULSE,
      selectedFigure: 'sonne',
      interpretation: {
        id: 'interp-1',
        text: 'Heute trägt deine Sonne den Tag mit ruhiger Klarheit.',
      },
    });

    const { container } = render(<TagespulsCard />);

    expect(container.textContent).toContain(
      'Heute trägt deine Sonne den Tag mit ruhiger Klarheit.',
    );
    // Aphorism still visible above.
    expect(container.textContent).toContain(FULL_PULSE.aphorism.slot_1);
  });

  it('TPC-008: phase 2 ai_unavailable → retry inline, aphorism stays', () => {
    const selectCouncilFigure = vi.fn();
    setHookState({
      pulse: FULL_PULSE,
      selectedFigure: 'mond',
      interpretation: null,
      interpretationError: { code: 'ai_unavailable', retryAfter: 300 },
      selectCouncilFigure,
    });

    const { container } = render(<TagespulsCard />);

    expect(screen.getByTestId('tagespuls-interp-error')).toBeTruthy();
    // Aphorism still visible.
    expect(container.textContent).toContain(FULL_PULSE.aphorism.slot_1);

    const retryBtn = screen.getByText('tagespuls.errors.retry');
    fireEvent.click(retryBtn);
    expect(selectCouncilFigure).toHaveBeenCalledWith('mond');
  });

  it('TPC-009: clicking a council button calls selectCouncilFigure with the right key', () => {
    const selectCouncilFigure = vi.fn();
    setHookState({ pulse: FULL_PULSE, selectCouncilFigure });

    const { container } = render(<TagespulsCard />);
    const sunBtn = container.querySelector('[data-figure-key="sonne"]');
    expect(sunBtn).toBeTruthy();
    fireEvent.click(sunBtn as Element);
    expect(selectCouncilFigure).toHaveBeenCalledWith('sonne');
  });

  it('TPC-NO-BACK-001: Phase 2 has NO back button (one-decision-per-day spec)', () => {
    // Per the 2026-05-09 product audit C-2: after the user picks an
    // archetype, they cannot un-pick. The "← Andere Figur wählen"
    // button must not render.
    setHookState({
      pulse: FULL_PULSE,
      selectedFigure: 'mond',
      interpretation: {
        id: 'int-1',
        text: 'Dein Mond Libra zeigt heute eine ruhige Wachsamkeit.',
      },
      loadingInterpretation: false,
      interpretationError: null,
    });

    render(<TagespulsCard />);

    // Phase 2 visible — interpretation is rendered
    expect(screen.getByText(/Dein Mond Libra/)).toBeInTheDocument();

    // The back button MUST NOT exist in any form
    expect(screen.queryByTestId('tagespuls-back')).not.toBeInTheDocument();
    expect(screen.queryByText(/Andere Figur wählen/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Choose another guide/i)).not.toBeInTheDocument();
    // Also: the resetFigure handler shouldn't be wired anywhere visible
    // (this is implicit — the buttons that would call it don't exist).
  });
});
