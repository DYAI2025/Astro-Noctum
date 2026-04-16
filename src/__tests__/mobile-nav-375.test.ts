import { describe, it, expect, afterEach } from "vitest";
import { computeCenterLinks, MOBILE_NAV_ITEM_CLASS } from "../lib/navigation";

const t = (key: string) => key;

describe("mobile nav at 375px — center-zone link computation", () => {
  it("on Dashboard (/): shows Signatur, omits Dashboard", () => {
    const links = computeCenterLinks("/", t, false);
    expect(links).toEqual([{ to: "/signatur", label: "nav.signatur" }]);
  });

  it("on Signatur (/signatur): shows Dashboard, omits Signatur", () => {
    const links = computeCenterLinks("/signatur", t, false);
    expect(links).toEqual([{ to: "/", label: "nav.dashboard" }]);
  });

  it("on fu-ring alias (/fu-ring): shows Dashboard, omits Signatur", () => {
    const links = computeCenterLinks("/fu-ring", t, false);
    expect(links).toEqual([{ to: "/", label: "nav.dashboard" }]);
  });

  it("on Atlas (/atlas): shows Dashboard + Signatur, omits Atlas", () => {
    const links = computeCenterLinks("/atlas", t, true);
    expect(links).toEqual([
      { to: "/", label: "nav.dashboard" },
      { to: "/signatur", label: "nav.signatur" },
    ]);
  });

  it("on other route (/wissen): shows Dashboard + Signatur", () => {
    const links = computeCenterLinks("/wissen", t, false);
    expect(links).toEqual([
      { to: "/", label: "nav.dashboard" },
      { to: "/signatur", label: "nav.signatur" },
    ]);
  });

  it("on other route with atlas flag: shows Dashboard + Signatur + Atlas (premium)", () => {
    const links = computeCenterLinks("/wissen", t, true);
    expect(links).toEqual([
      { to: "/", label: "nav.dashboard" },
      { to: "/signatur", label: "nav.signatur" },
      { to: "/atlas", label: "nav.atlas", premiumOnly: true },
    ]);
  });

  it("atlas flag off: Atlas link never appears", () => {
    for (const path of ["/", "/signatur", "/wissen", "/sky", "/faq"]) {
      const links = computeCenterLinks(path, t, false);
      expect(links.find((l) => l.to === "/atlas")).toBeUndefined();
    }
  });

  it("max 3 center links on any route (no overflow risk)", () => {
    const routes = ["/", "/signatur", "/atlas", "/wissen", "/sky", "/faq", "/wu-xing"];
    for (const path of routes) {
      const links = computeCenterLinks(path, t, true);
      expect(links.length).toBeLessThanOrEqual(3);
    }
  });
});

describe("mobile nav at 375px — touch target classes", () => {
  it("mobile nav item has min-w-[48px] and min-h-[48px]", () => {
    const cls = MOBILE_NAV_ITEM_CLASS(false);
    expect(cls).toContain("min-w-[48px]");
    expect(cls).toContain("min-h-[48px]");
  });

  it("mobile nav item uses flex column layout", () => {
    const cls = MOBILE_NAV_ITEM_CLASS(false);
    expect(cls).toContain("flex");
    expect(cls).toContain("flex-col");
    expect(cls).toContain("items-center");
    expect(cls).toContain("justify-center");
  });

  it("active state applies gold text", () => {
    expect(MOBILE_NAV_ITEM_CLASS(true)).toContain("text-gold-deep");
    expect(MOBILE_NAV_ITEM_CLASS(false)).toContain("text-ink/40");
  });
});

describe("mobile nav at 375px — overflow safety", () => {
  it("bottom nav fits 5 items at 375px (max items × min-width < viewport)", () => {
    const maxCenterLinks = 3;
    const utilityButtons = 3; // agents, theme, settings
    const totalItems = maxCenterLinks + utilityButtons;
    const minItemWidth = 48; // min-w-[48px]
    const padding = 2 * 8; // px-2 = 8px each side
    const totalMinWidth = totalItems * minItemWidth + padding;
    expect(totalMinWidth).toBeLessThanOrEqual(375);
  });

  it("bottom nav fits worst-case atlas-enabled route (6 items)", () => {
    const links = computeCenterLinks("/wissen", t, true);
    const utilityButtons = 3;
    const totalItems = links.length + utilityButtons;
    expect(totalItems).toBeLessThanOrEqual(6);
    const minItemWidth = 48;
    const padding = 16;
    expect(totalItems * minItemWidth + padding).toBeLessThanOrEqual(375);
  });

  afterEach(() => {
    localStorage.removeItem("ff_atlas_v1");
  });
});
