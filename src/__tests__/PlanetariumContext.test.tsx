// Tests: PlanetariumContext — toggle state, localStorage persistence, ARIA
import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { type ReactNode } from "react";
import {
  PlanetariumProvider,
  usePlanetarium,
  PLANETARIUM_STORAGE_KEY,
} from "../contexts/PlanetariumContext";

const wrapper = ({ children }: { children: ReactNode }) => (
  <PlanetariumProvider>{children}</PlanetariumProvider>
);

describe("PlanetariumContext — initial state", () => {
  beforeEach(() => localStorage.clear());

  it("defaults to false when localStorage is empty", () => {
    const { result } = renderHook(() => usePlanetarium(), { wrapper });
    expect(result.current.planetariumMode).toBe(false);
  });

  it("reads persisted 'true' from localStorage on mount", () => {
    localStorage.setItem(PLANETARIUM_STORAGE_KEY, "true");
    const { result } = renderHook(() => usePlanetarium(), { wrapper });
    expect(result.current.planetariumMode).toBe(true);
  });

  it("reads persisted 'false' from localStorage on mount", () => {
    localStorage.setItem(PLANETARIUM_STORAGE_KEY, "false");
    const { result } = renderHook(() => usePlanetarium(), { wrapper });
    expect(result.current.planetariumMode).toBe(false);
  });

  it("ignores invalid localStorage values (treats as false)", () => {
    localStorage.setItem(PLANETARIUM_STORAGE_KEY, "yes_please");
    const { result } = renderHook(() => usePlanetarium(), { wrapper });
    expect(result.current.planetariumMode).toBe(false);
  });
});

describe("PlanetariumContext — toggle", () => {
  beforeEach(() => localStorage.clear());

  it("togglePlanetarium flips false → true", () => {
    const { result } = renderHook(() => usePlanetarium(), { wrapper });
    act(() => result.current.togglePlanetarium());
    expect(result.current.planetariumMode).toBe(true);
  });

  it("togglePlanetarium flips true → false", () => {
    localStorage.setItem(PLANETARIUM_STORAGE_KEY, "true");
    const { result } = renderHook(() => usePlanetarium(), { wrapper });
    act(() => result.current.togglePlanetarium());
    expect(result.current.planetariumMode).toBe(false);
  });

  it("double-toggle returns to original state", () => {
    const { result } = renderHook(() => usePlanetarium(), { wrapper });
    act(() => result.current.togglePlanetarium());
    act(() => result.current.togglePlanetarium());
    expect(result.current.planetariumMode).toBe(false);
  });
});

describe("PlanetariumContext — localStorage persistence", () => {
  beforeEach(() => localStorage.clear());

  it("setPlanetariumMode(true) writes 'true' to localStorage", () => {
    const { result } = renderHook(() => usePlanetarium(), { wrapper });
    act(() => result.current.setPlanetariumMode(true));
    expect(localStorage.getItem(PLANETARIUM_STORAGE_KEY)).toBe("true");
  });

  it("setPlanetariumMode(false) writes 'false' to localStorage", () => {
    const { result } = renderHook(() => usePlanetarium(), { wrapper });
    act(() => result.current.setPlanetariumMode(true));
    act(() => result.current.setPlanetariumMode(false));
    expect(localStorage.getItem(PLANETARIUM_STORAGE_KEY)).toBe("false");
  });

  it("togglePlanetarium also updates localStorage", () => {
    const { result } = renderHook(() => usePlanetarium(), { wrapper });
    act(() => result.current.togglePlanetarium());
    expect(localStorage.getItem(PLANETARIUM_STORAGE_KEY)).toBe("true");
    act(() => result.current.togglePlanetarium());
    expect(localStorage.getItem(PLANETARIUM_STORAGE_KEY)).toBe("false");
  });
});

describe("PlanetariumContext — context default (no provider)", () => {
  it("usePlanetarium returns false when used outside provider", () => {
    const { result } = renderHook(() => usePlanetarium());
    expect(result.current.planetariumMode).toBe(false);
    // toggle and set functions are no-ops (don't throw)
    expect(() => act(() => result.current.togglePlanetarium())).not.toThrow();
    expect(() => act(() => result.current.setPlanetariumMode(true))).not.toThrow();
  });
});
