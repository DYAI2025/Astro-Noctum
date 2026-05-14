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
    // BUG-DAILY-001: server combines slot_2 + slot_3 into impulse_text
    // for legacy rows. Fixture mirrors the on-the-wire shape.
    impulse_text:
      'Du sitzt am Schreibtisch, der Kaffee dampft, und ein Gedanke schiebt sich vor. Schreib einen Satz auf, der den Tag öffnet.',
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

  it('TPC-002: real data renders aphorism + author + impulse_text + 6 council buttons', () => {
    // BUG-DAILY-001: slot_2 + slot_3 collapsed into single impulse_text
    // section — no internal labels.
    setHookState({ pulse: FULL_PULSE });
    const { container } = render(<TagespulsCard />);

    // Aphorism + author
    expect(container.textContent).toContain(FULL_PULSE.aphorism.slot_1);
    expect(container.textContent).toContain('Marcus Aurelius');

    // Consolidated impulse text visible (no internal Bridge/Impulse labels)
    expect(screen.getByTestId('tagespuls-impulse-text')).toBeTruthy();
    expect(container.textContent).toContain(FULL_PULSE.aphorism.impulse_text);
    // Old testids gone
    expect(screen.queryByTestId('tagespuls-bridge')).toBeNull();
    expect(screen.queryByTestId('tagespuls-impulse')).toBeNull();

    // 6 council buttons rendered
    const buttons = container.querySelectorAll('[data-figure-key]');
    expect(buttons).toHaveLength(6);
  });

  it('TPC-003: impulse_text null → impulse section omitted, NO placeholder text leaks', () => {
    // BUG-DAILY-001: when the LLM router fails, impulse_text is null
    // and the section is omitted entirely. No fallback copy injected.
    setHookState({
      pulse: {
        ...FULL_PULSE,
        aphorism: { ...FULL_PULSE.aphorism, impulse_text: null, slot_2: null, slot_3: null },
      },
    });
    const { container } = render(<TagespulsCard />);

    // The impulse subsection is entirely absent.
    expect(screen.queryByTestId('tagespuls-impulse-text')).toBeNull();
    // No legacy bridge/impulse testids either.
    expect(screen.queryByTestId('tagespuls-bridge')).toBeNull();
    expect(screen.queryByTestId('tagespuls-impulse')).toBeNull();
    // The internal label keys are NOT rendered.
    expect(container.textContent).not.toContain('tagespuls.bridge');
    expect(container.textContent).not.toContain('tagespuls.impulse');
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

  it('TPC-LOCK-001: council buttons absent or disabled in Phase 2 (one-decision-per-day)', () => {
    // Per 2026-05-09 audit C-3: after the user picks an archetype, the
    // entire council is visually locked. Phase 2 currently doesn't
    // re-render council buttons (they only show in Phase 1), so the
    // assertion is "no council buttons visible in Phase 2". If a future
    // refactor re-renders them in Phase 2, they MUST be disabled.
    setHookState({
      pulse: FULL_PULSE,
      selectedFigure: 'mond',
      interpretation: { id: 'int-1', text: 'Dein Mond Libra zeigt heute …' },
    });
    const { container } = render(<TagespulsCard />);

    const buttons = Array.from(
      container.querySelectorAll<HTMLButtonElement>('[data-figure-key]'),
    );
    if (buttons.length === 0) {
      expect(buttons).toHaveLength(0);
      return;
    }
    for (const b of buttons) {
      expect(b.hasAttribute('disabled')).toBe(true);
    }
  });

  it('TPC-LOCK-002: Phase 1 council buttons enabled before pick, disabled while loading', () => {
    // Sanity: in Phase 1, before any pick, buttons are enabled.
    // While the interpretation request is in-flight (loadingInterpretation),
    // they disable to prevent a 2nd-figure double-click.
    setHookState({
      pulse: FULL_PULSE,
      selectedFigure: null,
      interpretation: null,
      loadingInterpretation: false,
    });
    const { container, rerender } = render(<TagespulsCard />);

    let buttons = Array.from(
      container.querySelectorAll<HTMLButtonElement>('[data-figure-key]'),
    );
    expect(buttons).toHaveLength(6);
    for (const b of buttons) {
      expect(b.hasAttribute('disabled')).toBe(false);
    }

    // Now trigger the loading state.
    setHookState({
      pulse: FULL_PULSE,
      selectedFigure: null,
      interpretation: null,
      loadingInterpretation: true,
    });
    rerender(<TagespulsCard />);

    buttons = Array.from(container.querySelectorAll<HTMLButtonElement>('[data-figure-key]'));
    for (const b of buttons) {
      expect(b.hasAttribute('disabled')).toBe(true);
    }
  });

  it('TPC-NO-LABELS-001: no internal Bridge/Impulse labels appear in Phase 1', () => {
    // BUG-DAILY-001: "Bridge to today" / "Action impulse" are internal
    // prompt labels and must never appear in user-facing UI.
    setHookState({
      pulse: {
        ...FULL_PULSE,
        aphorism: {
          ...FULL_PULSE.aphorism,
          impulse_text: 'Heute trägt Mass mehr als der nächste Beweis. Schau hin, ohne sofort zu bewerten.',
          slot_2: null,
          slot_3: null,
        },
      },
      selectedFigure: null,
    });
    render(<TagespulsCard />);

    // Anti-label DOM walk — neither EN nor DE label may appear
    expect(screen.queryByText(/Bridge to today/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Brücke ins Heute/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Action impulse/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Handlungsimpuls/i)).not.toBeInTheDocument();

    // The consolidated impulse text IS rendered
    expect(screen.getByText(/Heute trägt Mass/i)).toBeInTheDocument();

    // Old testids gone, new testid present
    expect(screen.queryByTestId('tagespuls-bridge')).not.toBeInTheDocument();
    expect(screen.queryByTestId('tagespuls-impulse')).not.toBeInTheDocument();
    expect(screen.getByTestId('tagespuls-impulse-text')).toBeInTheDocument();
  });

  it('TPC-NO-LABELS-002: legacy 2-slot row renders consolidated text only (server-side joined)', () => {
    // Backward compat: cached rows from before this fix have both
    // slot_2 and slot_3 populated. The server normalizes to
    // impulse_text BEFORE returning. Component renders impulse_text
    // only, never the raw slots as separate sections.
    setHookState({
      pulse: {
        ...FULL_PULSE,
        aphorism: {
          ...FULL_PULSE.aphorism,
          impulse_text: 'Legacy bridge text. Legacy action impulse text.',
          slot_2: 'Legacy bridge text.',
          slot_3: 'Legacy action impulse text.',
        },
      },
      selectedFigure: null,
    });
    render(<TagespulsCard />);

    expect(screen.queryByText(/Bridge to today|Brücke ins Heute|Action impulse|Handlungsimpuls/)).not.toBeInTheDocument();
    expect(screen.getByText(/Legacy bridge text\. Legacy action impulse text\./)).toBeInTheDocument();
    expect(screen.queryByTestId('tagespuls-bridge')).not.toBeInTheDocument();
  });

  it('TPC-PHASE2-IMPULSE-001: Phase 2 keeps the consolidated impulse_text visible above the interpretation', () => {
    // BUG-DAILY-005: deep interpretation EXTENDS, doesn't REPLACE.
    // The general daily impulse text stays visible in Phase 2 so the
    // user has both layers — the day's general framing AND the
    // archetype-specific deep interpretation.
    setHookState({
      pulse: {
        ...FULL_PULSE,
        aphorism: {
          ...FULL_PULSE.aphorism,
          impulse_text: 'Heute trägt Mass mehr als der nächste Beweis. Schau hin, ohne sofort zu bewerten.',
          slot_2: null,
          slot_3: null,
        },
      },
      selectedFigure: 'mond',
      interpretation: { id: 'int-1', text: 'Dein Mond Libra zeigt heute eine ruhige Wachsamkeit.' },
      loadingInterpretation: false,
    });
    render(<TagespulsCard />);

    // BOTH texts visible
    expect(screen.getByText(/Heute trägt Mass/i)).toBeInTheDocument();
    expect(screen.getByText(/Dein Mond Libra zeigt heute/i)).toBeInTheDocument();

    // Anti-regression: still no internal labels
    expect(screen.queryByText(/Brücke ins Heute|Bridge to today/)).not.toBeInTheDocument();
  });

  it('TPC-PHASE2-IMPULSE-002: Phase 2 with hydrated existing_decision (mount-time) also shows impulse_text', () => {
    // Edge case: user lands on dashboard with an existing decision
    // hydrated from the server (BUG-DAILY-003/004 fix). Phase 2 must
    // still show the impulse_text — no flash, no missing daily framing.
    setHookState({
      pulse: {
        ...FULL_PULSE,
        aphorism: {
          ...FULL_PULSE.aphorism,
          impulse_text: 'consolidated impulse for today',
          slot_2: null,
          slot_3: null,
        },
      },
      selectedFigure: 'sonne',
      interpretation: { id: 'hydrated', text: 'Stier-Sonne deep interpretation hydrated from server' },
      loadingInterpretation: false,
    });
    render(<TagespulsCard />);

    expect(screen.getByText(/consolidated impulse for today/i)).toBeInTheDocument();
    expect(screen.getByText(/Stier-Sonne deep interpretation/i)).toBeInTheDocument();
  });
});
