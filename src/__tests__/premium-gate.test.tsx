// src/__tests__/premium-gate.test.tsx
//
// Phase C contract tests — PremiumGate is info-only.
//
// After Phase C of the 2026-05-07 dashboard CTA consolidation,
// PremiumGate stops rendering an inline <UpgradeButton/>. The five
// mount points (DashboardAstroSection, DashboardInterpretationSection,
// DashboardTagesEnergie, WuXingPage, SynastryPage) now show only a
// lock icon + "Premium-Inhalt" label + teaser + unlock hint. The
// single prime upgrade CTA stays at the bottom of /.
//
// PG-003 enforces the single-CTA invariant directly at the gate
// level — no <button> may appear in the gate's render tree for
// free users.
//
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

// ── Hook mock — mutable so each test can flip premium state ───────────
let mockIsPremium = false;

vi.mock("../hooks/usePremium", () => ({
  usePremium: () => ({ isPremium: mockIsPremium, loading: false }),
}));

// ── i18n mock — return recognizable strings for the four keys the
//    info-only gate consumes (lockLabel, teaser, unlockHint) plus
//    title (still in translations.ts but no longer rendered by gate).
const I18N_MAP: Record<string, string> = {
  "dashboard.premium.title": "Dein vollständiges Reading freischalten",
  "dashboard.premium.teaser":
    "Entdecke die komplette Fusion aus westlicher Astrologie, BaZi und Wu-Xing.",
  "dashboard.premium.lockLabel": "Premium-Inhalt",
  "dashboard.premium.unlockHint":
    "Schalte ihn mit dem Upgrade-Button unten frei.",
};

vi.mock("../contexts/LanguageContext", () => ({
  useLanguage: () => ({
    t: (key: string) => I18N_MAP[key] ?? key,
    lang: "de",
    setLang: vi.fn(),
  }),
}));

// Importing AFTER the mocks are registered.
import { PremiumGate } from "../components/PremiumGate";

describe("PremiumGate (info-only)", () => {
  beforeEach(() => {
    mockIsPremium = false;
  });

  it("PG-001: premium user sees children unblurred and no gate wrapper", () => {
    mockIsPremium = true;
    render(
      <PremiumGate>
        <div data-testid="payload">premium-only</div>
      </PremiumGate>,
    );
    expect(screen.getByTestId("payload")).toHaveTextContent("premium-only");
    // The locked-gate wrapper must not be in the tree for premium users.
    expect(screen.queryByTestId("premium-gate-locked")).not.toBeInTheDocument();
  });

  it("PG-002: free user sees blurred children + lock label + teaser + unlock hint", () => {
    mockIsPremium = false;
    render(
      <PremiumGate>
        <div data-testid="payload">premium-only</div>
      </PremiumGate>,
    );
    // Children are still mounted (just blurred behind aria-hidden).
    expect(screen.getByTestId("payload")).toBeInTheDocument();
    expect(screen.getByTestId("premium-gate-locked")).toBeInTheDocument();
    expect(screen.getByText("Premium-Inhalt")).toBeInTheDocument();
    expect(screen.getByText(/Upgrade-Button unten/)).toBeInTheDocument();
  });

  it("PG-003: free user sees ZERO buttons (single-CTA invariant)", () => {
    mockIsPremium = false;
    render(
      <PremiumGate>
        <div>x</div>
      </PremiumGate>,
    );
    // The whole point of Phase C: the gate itself never renders a CTA.
    // The prime upgrade button lives at the page level, not inside the gate.
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("PG-004: respects custom teaser prop (overrides default i18n teaser)", () => {
    mockIsPremium = false;
    render(
      <PremiumGate teaser="BaZi pillars unlock here.">
        <div>x</div>
      </PremiumGate>,
    );
    expect(screen.getByText("BaZi pillars unlock here.")).toBeInTheDocument();
    // Default teaser must NOT appear when an override is passed.
    expect(
      screen.queryByText(/Entdecke die komplette Fusion/),
    ).not.toBeInTheDocument();
  });

  it("PG-005: ctaLabel prop is gone — Props type only allows children + teaser", () => {
    // Compile-time invariant: tsc enforces that the Props interface
    // exposes only `children` and `teaser`. If anyone re-adds `ctaLabel`
    // (or any other prop), this file's typecheck would still pass for
    // the legitimate uses — the protection is upstream in tsc + the
    // five call sites' typechecks. This test exists as documentation.
    mockIsPremium = false;
    render(
      <PremiumGate teaser="x">
        <div>y</div>
      </PremiumGate>,
    );
    // Sanity: gate still renders its info-only surface.
    expect(screen.getByTestId("premium-gate-locked")).toBeInTheDocument();
  });

  it("PG-006: premium user shortcut returns children directly (no overlay markup)", () => {
    mockIsPremium = true;
    const { container } = render(
      <PremiumGate>
        <div data-testid="payload">premium-only</div>
      </PremiumGate>,
    );
    // No blurred wrapper, no lock-icon overlay — just the children.
    expect(container.querySelector(".blur-sm")).toBeNull();
    expect(container.querySelector('[aria-hidden="true"]')).toBeNull();
    expect(screen.queryByText("Premium-Inhalt")).not.toBeInTheDocument();
  });
});
