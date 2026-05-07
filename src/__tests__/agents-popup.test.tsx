import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AgentsPopup } from "../components/navigation/AgentsPopup";
import { AgentProvider } from "../contexts/AgentContext";
import { LanguageProvider } from "../contexts/LanguageContext";

// UpgradeButton (rendered transitively when isPremium=false) now uses
// useAuth via the useUpgradeCheckout hook. Stub it so the popup tree
// does not need a real AuthProvider.
vi.mock("../contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: "u1" } }),
}));

function renderPopup(overrides: { isPremium?: boolean; lang?: "de" | "en" } = {}) {
  const onClose = vi.fn();
  const onStopAudio = vi.fn();
  const { isPremium = true, lang = "de" } = overrides;

  const utils = render(
    <LanguageProvider>
      <AgentProvider>
        <AgentsPopup
          position="desktop"
          isPremium={isPremium}
          lang={lang}
          t={(k: string) => k}
          onStopAudio={onStopAudio}
          onClose={onClose}
        />
      </AgentProvider>
    </LanguageProvider>
  );
  return { ...utils, onClose, onStopAudio };
}

describe("AgentsPopup", () => {
  it("renders Levi tile with name and description", () => {
    renderPopup({ lang: "de" });
    expect(screen.getByText("Levi Bazi")).toBeDefined();
    expect(screen.getByText(/Dein ruhiger Mentor/)).toBeDefined();
  });

  it("shows call button for premium users", () => {
    renderPopup({ isPremium: true, lang: "de" });
    expect(screen.getByText("Levi Bazi anrufen")).toBeDefined();
  });

  it("shows upgrade button for free users", () => {
    renderPopup({ isPremium: false, lang: "de" });
    expect(screen.getByText("Premium freischalten")).toBeDefined();
  });

  it("closes on Escape key", () => {
    const { onClose } = renderPopup();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("closes on backdrop click", () => {
    const { onClose } = renderPopup();
    const backdrop = document.querySelector("[aria-hidden='true']")!;
    fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("does not render Eve tile (levi-only scope)", () => {
    renderPopup();
    expect(screen.queryByText("Eve")).toBeNull();
  });
});
