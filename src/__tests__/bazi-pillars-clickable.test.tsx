import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BaZiFourPillars } from "../components/BaZiFourPillars";

// ── Mocks ──────────────────────────────────────────────────────────────────────

vi.mock("motion/react", () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("../lib/astro-data/coinAssets", () => ({
  getCoinAsset: () => undefined,
}));

vi.mock("../lib/astro-data/earthlyBranches", () => ({
  getBranchByAnimal: (animal: string) => {
    if (animal === "Tiger") {
      return {
        animal: { en: "Tiger", de: "Tiger" },
        chinese: "寅",
        description: { en: "Tiger EN desc", de: "Tiger DE Beschreibung" },
      };
    }
    return null;
  },
}));

vi.mock("../lib/astro-data/wuxing", () => ({
  getWuxingByKey: (key: string) =>
    key === "Wood"
      ? { color: "#4a7c4e", chinese: "木", name: { en: "Wood", de: "Holz" } }
      : null,
}));

vi.mock("../lib/astro-data/heavenlyStems", () => ({
  getStemByCharacter: (char: string) => {
    if (char === "甲") {
      return {
        chinese: "甲",
        name: { en: "Jiǎ Wood (Yang)", de: "Jiǎ Holz (Yang)" },
        dayMaster: { en: "Jiǎ dayMaster EN", de: "Jiǎ dayMaster DE" },
        monthStem: { en: "Jiǎ monthStem EN", de: "Jiǎ monthStem DE" },
      };
    }
    return null;
  },
}));

vi.mock("../contexts/LanguageContext", () => ({
  useLanguage: () => ({
    lang: "en",
    t: (key: string) => {
      if (key === "dashboard.bazi.birthTimeNotProvided") return "Birth time not provided";
      return key;
    },
  }),
}));

// ── Test data ─────────────────────────────────────────────────────────────────

const basePillars = {
  year:  { stem: "甲", branch: "寅", animal: "Tiger", element: "Wood" },
  month: { stem: "甲", branch: "寅", animal: "Tiger", element: "Wood" },
  day:   { stem: "甲", branch: "寅", animal: "Tiger", element: "Wood" },
  hour:  { stem: "甲", branch: "寅", animal: "Tiger", element: "Wood" },
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("BaZiFourPillars — clickable pillars", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders four pillar buttons", () => {
    render(<BaZiFourPillars pillars={basePillars} lang="en" />);
    expect(screen.getByRole("button", { name: /Year Pillar/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Month Pillar/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Day Pillar/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Hour Pillar/i })).toBeInTheDocument();
  });

  it("detail panel is not shown by default", () => {
    render(<BaZiFourPillars pillars={basePillars} lang="en" />);
    expect(screen.queryByText("Jiǎ dayMaster EN")).not.toBeInTheDocument();
    expect(screen.queryByText("Tiger EN desc")).not.toBeInTheDocument();
  });

  it("clicking year pillar shows pillar desc + animal desc + monthStem (non-day context)", () => {
    render(<BaZiFourPillars pillars={basePillars} lang="en" />);
    fireEvent.click(screen.getByRole("button", { name: /Year Pillar/i }));

    // Generic pillar description
    expect(screen.getByText(/how society perceives you/i)).toBeInTheDocument();
    // monthStem for non-day pillars
    expect(screen.getByText("Jiǎ monthStem EN")).toBeInTheDocument();
    // Animal description
    expect(screen.getByText("Tiger EN desc")).toBeInTheDocument();
  });

  it("clicking day pillar shows dayMaster context", () => {
    render(<BaZiFourPillars pillars={basePillars} lang="en" />);
    fireEvent.click(screen.getByRole("button", { name: /Day Pillar/i }));

    expect(screen.getByText("Jiǎ dayMaster EN")).toBeInTheDocument();
  });

  it("clicking year pillar does NOT show dayMaster context", () => {
    render(<BaZiFourPillars pillars={basePillars} lang="en" />);
    fireEvent.click(screen.getByRole("button", { name: /Year Pillar/i }));

    expect(screen.queryByText("Jiǎ dayMaster EN")).not.toBeInTheDocument();
    expect(screen.getByText("Jiǎ monthStem EN")).toBeInTheDocument();
  });

  it("only one pillar panel open at a time — opening another closes current", () => {
    render(<BaZiFourPillars pillars={basePillars} lang="en" />);

    fireEvent.click(screen.getByRole("button", { name: /Year Pillar/i }));
    // Year panel open — shows 'how society perceives you'
    expect(screen.getByText(/how society perceives you/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Month Pillar/i }));
    // Month panel open — shows different desc
    expect(screen.getByText(/career, ambition/i)).toBeInTheDocument();
    // Year panel desc gone
    expect(screen.queryByText(/how society perceives you/i)).not.toBeInTheDocument();
  });

  it("clicking the same pillar again collapses the panel", () => {
    render(<BaZiFourPillars pillars={basePillars} lang="en" />);
    const btn = screen.getByRole("button", { name: /Year Pillar/i });

    fireEvent.click(btn);
    expect(screen.getByText(/how society perceives you/i)).toBeInTheDocument();

    fireEvent.click(btn);
    expect(screen.queryByText(/how society perceives you/i)).not.toBeInTheDocument();
  });

  it("shows German content when lang=de", () => {
    render(<BaZiFourPillars pillars={basePillars} lang="de" />);
    fireEvent.click(screen.getByRole("button", { name: /Tages-Säule/i }));
    expect(screen.getByText("Jiǎ dayMaster DE")).toBeInTheDocument();
    expect(screen.getByText("Tiger DE Beschreibung")).toBeInTheDocument();
  });

  it("returns null when no pillars provided", () => {
    const { container } = render(<BaZiFourPillars pillars={undefined} lang="en" />);
    expect(container.firstChild).toBeNull();
  });

  it("shows birth-time-not-provided when pillar has no stem or animal", () => {
    const emptyPillars = {
      ...basePillars,
      hour: { stem: "", branch: "", animal: "", element: "" },
    };
    render(<BaZiFourPillars pillars={emptyPillars} lang="en" />);
    expect(screen.getByText("Birth time not provided")).toBeInTheDocument();
  });
});
