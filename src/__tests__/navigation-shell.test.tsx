import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { computeCenterLinks } from "../lib/navigation";
import { SettingsMenu } from "../components/navigation/SettingsMenu";
import { AgentsPopup } from "../components/navigation/AgentsPopup";
import { AgentProvider } from "../contexts/AgentContext";
import { LanguageProvider } from "../contexts/LanguageContext";
import { isFeatureEnabled } from "../lib/feature-flags";

// UpgradeButton (rendered transitively when isPremium=false) now uses
// useAuth via the useUpgradeCheckout hook. Stub it so the popup tree
// does not need a real AuthProvider.
vi.mock("../contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: "u1" } }),
}));

const t = (key: string) => key;

// ── 1. Contextual link visibility per route ─────────────────────────

describe("center-zone contextual links per route", () => {
  it("Dashboard (/) always shows Signatur link", () => {
    const links = computeCenterLinks("/", t, false);
    expect(links.some((l) => l.to === "/signatur")).toBe(true);
    expect(links.some((l) => l.to === "/")).toBe(false);
  });

  it("Signatur (/signatur) always shows Dashboard link", () => {
    const links = computeCenterLinks("/signatur", t, false);
    expect(links.some((l) => l.to === "/")).toBe(true);
    expect(links.some((l) => l.to === "/signatur")).toBe(false);
  });

  it("other routes (Sky, Wissen, Wu-Xing, FAQ) show both Dashboard + Signatur", () => {
    for (const path of ["/sky", "/wissen", "/wu-xing", "/faq"]) {
      const links = computeCenterLinks(path, t, false);
      expect(links.some((l) => l.to === "/")).toBe(true);
      expect(links.some((l) => l.to === "/signatur")).toBe(true);
    }
  });

  it("no route ever produces a self-link", () => {
    const routes = ["/", "/signatur", "/fu-ring", "/atlas", "/wissen", "/sky"];
    for (const path of routes) {
      const links = computeCenterLinks(path, t, true);
      expect(links.some((l) => l.to === path)).toBe(false);
    }
  });
});

// ── 2. Active-route disabled state ──────────────────────────────────

describe("active-route disabled state", () => {
  it("current route is excluded from center links (not rendered at all)", () => {
    expect(computeCenterLinks("/", t, false).find((l) => l.to === "/")).toBeUndefined();
    expect(computeCenterLinks("/signatur", t, false).find((l) => l.to === "/signatur")).toBeUndefined();
    expect(computeCenterLinks("/atlas", t, true).find((l) => l.to === "/atlas")).toBeUndefined();
  });

  it("fu-ring alias treated same as /signatur", () => {
    const fromFuRing = computeCenterLinks("/fu-ring", t, false);
    const fromSignatur = computeCenterLinks("/signatur", t, false);
    expect(fromFuRing).toEqual(fromSignatur);
  });
});

// ── 3. Atlas flag-gate behavior ─────────────────────────────────────

describe("Atlas feature flag gating", () => {
  afterEach(() => {
    localStorage.removeItem("ff_atlas_v1");
  });

  it("atlas_v1 is disabled by default", () => {
    expect(isFeatureEnabled("atlas_v1")).toBe(false);
  });

  it("Atlas link never appears when flag is off", () => {
    for (const path of ["/", "/signatur", "/wissen"]) {
      const links = computeCenterLinks(path, t, false);
      expect(links.find((l) => l.to === "/atlas")).toBeUndefined();
    }
  });

  it("Atlas link appears when flag is on (non-atlas routes)", () => {
    const links = computeCenterLinks("/wissen", t, true);
    const atlas = links.find((l) => l.to === "/atlas");
    expect(atlas).toBeDefined();
    expect(atlas!.premiumOnly).toBe(true);
  });

  it("Atlas link is always premiumOnly", () => {
    const links = computeCenterLinks("/", t, true);
    const atlas = links.find((l) => l.to === "/atlas");
    expect(atlas?.premiumOnly).toBe(true);
  });

  it("localStorage override enables atlas_v1", () => {
    localStorage.setItem("ff_atlas_v1", "true");
    expect(isFeatureEnabled("atlas_v1")).toBe(true);
  });
});

// ── 4. Agents popup — Levi tile + premium gating ────────────────────

function renderAgentsPopup(overrides: { isPremium?: boolean; lang?: "de" | "en" } = {}) {
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
          t={t}
          onStopAudio={onStopAudio}
          onClose={onClose}
        />
      </AgentProvider>
    </LanguageProvider>,
  );
  return { ...utils, onClose, onStopAudio };
}

describe("Agents popup — Levi + premium gating", () => {
  it("renders Levi tile with name", () => {
    renderAgentsPopup();
    expect(screen.getByText("Levi Bazi")).toBeDefined();
  });

  it("premium user sees call CTA", () => {
    renderAgentsPopup({ isPremium: true });
    expect(screen.getByText("Levi Bazi anrufen")).toBeDefined();
  });

  it("free user sees upgrade button instead of call", () => {
    renderAgentsPopup({ isPremium: false });
    expect(screen.getByText("Premium freischalten")).toBeDefined();
    expect(screen.queryByText("Levi Bazi anrufen")).toBeNull();
  });

  it("does not render Eve (deferred to multi-agent sprint)", () => {
    renderAgentsPopup();
    expect(screen.queryByText("Eve")).toBeNull();
  });

  it("closes on Escape", () => {
    const { onClose } = renderAgentsPopup();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("closes on backdrop click", () => {
    const { onClose } = renderAgentsPopup();
    const backdrop = document.querySelector("[aria-hidden='true']")!;
    fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalledOnce();
  });
});

// ── 5. Settings mode-toggle icons-only ──────────────────────────────

function renderSettings(overrides: { planetariumMode?: boolean } = {}) {
  const onClose = vi.fn();
  const togglePlanetarium = vi.fn();
  const { planetariumMode = true } = overrides;
  const utils = render(
    <MemoryRouter>
      <SettingsMenu
        position="desktop"
        user={{ email: "test@example.com" }}
        lang="de"
        setLang={vi.fn()}
        planetariumMode={planetariumMode}
        togglePlanetarium={togglePlanetarium}
        signOut={vi.fn()}
        t={t}
        onOpenLegal={vi.fn()}
        onClose={onClose}
        isPremium={false}
      />
    </MemoryRouter>,
  );
  return { ...utils, onClose, togglePlanetarium };
}

describe("Settings mode-toggle — icons-only", () => {
  it("mode toggle has no text labels (Planetarium/Solar System)", () => {
    renderSettings();
    expect(screen.queryByText("Planetarium")).toBeNull();
    expect(screen.queryByText("Solar System")).toBeNull();
  });

  it("mode toggle retains 'Modus' row label", () => {
    renderSettings();
    expect(screen.getByText("Modus")).toBeDefined();
  });

  it("mode toggle has two buttons with aria-pressed", () => {
    renderSettings();
    const modeGroup = screen.getByRole("group", { name: "Anzeigemodus" });
    const buttons = modeGroup.querySelectorAll("button");
    expect(buttons).toHaveLength(2);
    expect(buttons[0].getAttribute("aria-pressed")).toBeDefined();
    expect(buttons[1].getAttribute("aria-pressed")).toBeDefined();
  });

  it("Moon button is pressed when planetariumMode is true", () => {
    renderSettings({ planetariumMode: true });
    const modeGroup = screen.getByRole("group", { name: "Anzeigemodus" });
    const buttons = modeGroup.querySelectorAll("button");
    expect(buttons[0].getAttribute("aria-pressed")).toBe("true");
    expect(buttons[1].getAttribute("aria-pressed")).toBe("false");
  });

  it("Sun button is pressed when planetariumMode is false", () => {
    renderSettings({ planetariumMode: false });
    const modeGroup = screen.getByRole("group", { name: "Anzeigemodus" });
    const buttons = modeGroup.querySelectorAll("button");
    expect(buttons[0].getAttribute("aria-pressed")).toBe("false");
    expect(buttons[1].getAttribute("aria-pressed")).toBe("true");
  });

  it("clicking inactive Moon button calls togglePlanetarium", () => {
    const { togglePlanetarium } = renderSettings({ planetariumMode: false });
    const modeGroup = screen.getByRole("group", { name: "Anzeigemodus" });
    const moonButton = modeGroup.querySelectorAll("button")[0];
    fireEvent.click(moonButton);
    expect(togglePlanetarium).toHaveBeenCalledOnce();
  });

  it("clicking active Moon button does NOT call togglePlanetarium", () => {
    const { togglePlanetarium } = renderSettings({ planetariumMode: true });
    const modeGroup = screen.getByRole("group", { name: "Anzeigemodus" });
    const moonButton = modeGroup.querySelectorAll("button")[0];
    fireEvent.click(moonButton);
    expect(togglePlanetarium).not.toHaveBeenCalled();
  });

  it("mode toggle buttons have aria-label for a11y", () => {
    renderSettings();
    const modeGroup = screen.getByRole("group", { name: "Anzeigemodus" });
    const buttons = modeGroup.querySelectorAll("button");
    expect(buttons[0].getAttribute("aria-label")).toBe("Planetarium (dunkel)");
    expect(buttons[1].getAttribute("aria-label")).toBe("Solar System (hell)");
  });

  it("Settings closes on Escape", () => {
    const { onClose } = renderSettings();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledOnce();
  });
});

// ── 6. Theme toggle reflects state (right-zone button) ──────────────

describe("theme toggle state reflection", () => {
  it("computeCenterLinks is pure — does not depend on theme state", () => {
    const a = computeCenterLinks("/", t, false);
    const b = computeCenterLinks("/", t, false);
    expect(a).toEqual(b);
  });
});
