import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import type { UpgradeCheckoutError } from "../hooks/useUpgradeCheckout";

// ── Hook mock with mutable state ──────────────────────────────────────
// Each test mutates `mockState` before render(); the mocked hook reads
// from it at call time. `startUpgradeCheckout` is a vi.fn we can assert
// against directly.
const startUpgradeCheckout = vi.fn();
const clearError = vi.fn();
const mockState: {
  isLoading: boolean;
  error: UpgradeCheckoutError | null;
} = {
  isLoading: false,
  error: null,
};

vi.mock("@/src/hooks/useUpgradeCheckout", () => ({
  useUpgradeCheckout: () => ({
    startUpgradeCheckout,
    isLoading: mockState.isLoading,
    error: mockState.error,
    clearError,
  }),
}));

// ── i18n mock — return a recognizable string per key ──────────────────
const I18N_MAP: Record<string, string> = {
  "dashboard.premium.cta": "Upgrade — 4,99 €",
  "dashboard.premium.errors.authRequired": "Bitte zuerst anmelden.",
  "dashboard.premium.errors.alreadyPremium": "Du hast bereits Premium.",
  "dashboard.premium.errors.network":
    "Verbindungsproblem. Bitte Netzwerk prüfen.",
  "dashboard.premium.errors.stripeUnavailable":
    "Bezahlung wird gerade konfiguriert.",
  "dashboard.premium.errors.server": "Serverfehler. Bitte später erneut.",
  "dashboard.premium.errors.unknown": "Unbekannter Fehler.",
};

vi.mock("@/src/contexts/LanguageContext", () => ({
  useLanguage: () => ({
    t: (key: string) => I18N_MAP[key] ?? key,
    lang: "de",
    setLang: vi.fn(),
  }),
}));

// Importing AFTER mocks are registered.
import { UpgradeButton } from "../components/UpgradeButton";

describe("UpgradeButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockState.isLoading = false;
    mockState.error = null;
  });

  it("renders default label and calls startUpgradeCheckout on click", () => {
    render(<UpgradeButton />);
    const btn = screen.getByRole("button");
    expect(btn.textContent).toBe("Upgrade — 4,99 €");
    fireEvent.click(btn);
    expect(startUpgradeCheckout).toHaveBeenCalledTimes(1);
  });

  it("respects custom label prop", () => {
    render(<UpgradeButton label="Jetzt upgraden" />);
    const btn = screen.getByRole("button");
    expect(btn.textContent).toBe("Jetzt upgraden");
  });

  it("respects custom className (overrides default)", () => {
    render(<UpgradeButton className="my-custom-class" />);
    const btn = screen.getByRole("button");
    expect(btn.className).toBe("my-custom-class");
    // The default styling tokens should NOT be present.
    expect(btn.className).not.toContain("bg-[#D4AF37]");
  });

  it("uses default styling when className is omitted", () => {
    render(<UpgradeButton />);
    const btn = screen.getByRole("button");
    expect(btn.className).toContain("bg-[#D4AF37]");
    expect(btn.className).toContain("text-[#00050A]");
  });

  it("disabled when isLoading=true and shows ellipsis", () => {
    mockState.isLoading = true;
    render(<UpgradeButton />);
    const btn = screen.getByRole("button") as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
    expect(btn.textContent).toBe("…");
  });

  it("error: auth_required renders authRequired copy", () => {
    mockState.error = "auth_required";
    render(<UpgradeButton />);
    const alert = screen.getByTestId("upgrade-button-error");
    expect(alert.textContent).toBe("Bitte zuerst anmelden.");
    expect(alert.getAttribute("role")).toBe("alert");
  });

  it("error: already_premium renders alreadyPremium copy", () => {
    mockState.error = "already_premium";
    render(<UpgradeButton />);
    expect(screen.getByTestId("upgrade-button-error").textContent).toBe(
      "Du hast bereits Premium.",
    );
  });

  it("error: network renders network copy", () => {
    mockState.error = "network";
    render(<UpgradeButton />);
    expect(screen.getByTestId("upgrade-button-error").textContent).toBe(
      "Verbindungsproblem. Bitte Netzwerk prüfen.",
    );
  });

  it("error: stripe_unavailable renders stripeUnavailable copy", () => {
    mockState.error = "stripe_unavailable";
    render(<UpgradeButton />);
    expect(screen.getByTestId("upgrade-button-error").textContent).toBe(
      "Bezahlung wird gerade konfiguriert.",
    );
  });

  it("error: server renders server copy", () => {
    mockState.error = "server";
    render(<UpgradeButton />);
    expect(screen.getByTestId("upgrade-button-error").textContent).toBe(
      "Serverfehler. Bitte später erneut.",
    );
  });

  it("error: unknown renders unknown copy", () => {
    mockState.error = "unknown";
    render(<UpgradeButton />);
    expect(screen.getByTestId("upgrade-button-error").textContent).toBe(
      "Unbekannter Fehler.",
    );
  });

  it("error null: no error paragraph rendered", () => {
    mockState.error = null;
    render(<UpgradeButton />);
    expect(screen.queryByTestId("upgrade-button-error")).toBeNull();
  });
});
