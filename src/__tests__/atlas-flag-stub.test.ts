import { describe, it, expect, afterEach } from "vitest";
import { isFeatureEnabled } from "../lib/feature-flags";

describe("atlas_v1 feature flag", () => {
  afterEach(() => {
    localStorage.removeItem("ff_atlas_v1");
  });

  it("is disabled by default", () => {
    expect(isFeatureEnabled("atlas_v1")).toBe(false);
  });

  it("can be enabled via localStorage override", () => {
    localStorage.setItem("ff_atlas_v1", "true");
    expect(isFeatureEnabled("atlas_v1")).toBe(true);
  });

  it("can be explicitly disabled via localStorage", () => {
    localStorage.setItem("ff_atlas_v1", "false");
    expect(isFeatureEnabled("atlas_v1")).toBe(false);
  });
});
