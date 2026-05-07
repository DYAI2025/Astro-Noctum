import { renderHook, act } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";

// ── Mocks ─────────────────────────────────────────────────────────────
const trackEvent = vi.fn();
vi.mock("@/src/lib/analytics", () => ({
  trackEvent: (...args: unknown[]) => trackEvent(...args),
}));

const authedFetch = vi.fn();
vi.mock("@/src/lib/authedFetch", () => ({
  authedFetch: (...args: unknown[]) => authedFetch(...args),
}));

const useAuthMock = vi.fn(() => ({ user: { id: "u1" } }));
vi.mock("@/src/contexts/AuthContext", () => ({
  useAuth: () => useAuthMock(),
}));

// ── window.location shim ──────────────────────────────────────────────
// happy-dom's window.location is read-only; replace it once per test
// with a plain object so we can assert assignments to .href.
let hrefCapture = "";
beforeEach(() => {
  hrefCapture = "";
  // @ts-expect-error -- intentional override of read-only DOM prop for tests
  delete window.location;
  // @ts-expect-error -- intentional override of read-only DOM prop for tests
  window.location = {
    set href(v: string) {
      hrefCapture = v;
    },
    get href() {
      return hrefCapture;
    },
  };
});

afterEach(() => {
  vi.clearAllMocks();
  useAuthMock.mockReturnValue({ user: { id: "u1" } });
});

// Build a Response-like stub. Each call to .json() returns a fresh
// resolved promise so the hook's single .json() call always works.
function makeRes(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  } as unknown as Response;
}

async function loadHook() {
  const mod = await import("../hooks/useUpgradeCheckout");
  return mod.useUpgradeCheckout;
}

// ── Tests ─────────────────────────────────────────────────────────────
describe("useUpgradeCheckout", () => {
  it("successful checkout: fires funnel events, redirects, no error", async () => {
    authedFetch.mockResolvedValue(
      makeRes(200, { url: "https://checkout.stripe.com/abc" }),
    );

    const useUpgradeCheckout = await loadHook();
    const { result } = renderHook(() => useUpgradeCheckout());

    await act(async () => {
      await result.current.startUpgradeCheckout();
    });

    expect(authedFetch).toHaveBeenCalledWith(
      "/api/checkout",
      expect.objectContaining({ method: "POST" }),
    );
    expect(trackEvent).toHaveBeenCalledWith("upgrade_clicked");
    expect(trackEvent).toHaveBeenCalledWith("upgrade_checkout_started");
    expect(trackEvent).toHaveBeenCalledWith(
      "upgrade_checkout_success_redirect",
    );
    expect(hrefCapture).toBe("https://checkout.stripe.com/abc");
    expect(result.current.error).toBeNull();
  });

  it("auth_required: skips fetch when useAuth().user is null", async () => {
    useAuthMock.mockReturnValue({ user: null } as unknown as { user: { id: string } });

    const useUpgradeCheckout = await loadHook();
    const { result } = renderHook(() => useUpgradeCheckout());

    await act(async () => {
      await result.current.startUpgradeCheckout();
    });

    expect(authedFetch).not.toHaveBeenCalled();
    expect(result.current.error).toBe("auth_required");
    expect(trackEvent).toHaveBeenCalledWith(
      "upgrade_checkout_error_auth_required",
    );
    expect(result.current.isLoading).toBe(false);
  });

  it("already_premium: maps 400 to already_premium", async () => {
    authedFetch.mockResolvedValue(
      makeRes(400, { error: "Du hast bereits ein Premium-Abonnement." }),
    );

    const useUpgradeCheckout = await loadHook();
    const { result } = renderHook(() => useUpgradeCheckout());

    await act(async () => {
      await result.current.startUpgradeCheckout();
    });

    expect(result.current.error).toBe("already_premium");
    expect(trackEvent).toHaveBeenCalledWith(
      "upgrade_checkout_error_already_premium",
    );
    expect(hrefCapture).toBe("");
  });

  it("network: maps fetch rejection to network", async () => {
    authedFetch.mockRejectedValue(new TypeError("Failed to fetch"));

    const useUpgradeCheckout = await loadHook();
    const { result } = renderHook(() => useUpgradeCheckout());

    await act(async () => {
      await result.current.startUpgradeCheckout();
    });

    expect(result.current.error).toBe("network");
    expect(trackEvent).toHaveBeenCalledWith("upgrade_checkout_error_network");
  });

  it("stripe_unavailable: maps 503 + STRIPE_NOT_CONFIGURED", async () => {
    authedFetch.mockResolvedValue(
      makeRes(503, {
        error: "Payment system is being configured.",
        code: "STRIPE_NOT_CONFIGURED",
      }),
    );

    const useUpgradeCheckout = await loadHook();
    const { result } = renderHook(() => useUpgradeCheckout());

    await act(async () => {
      await result.current.startUpgradeCheckout();
    });

    expect(result.current.error).toBe("stripe_unavailable");
    expect(trackEvent).toHaveBeenCalledWith(
      "upgrade_checkout_error_stripe_unavailable",
    );
  });

  it("server: maps generic 500 to server", async () => {
    authedFetch.mockResolvedValue(makeRes(500, { error: "Internal" }));

    const useUpgradeCheckout = await loadHook();
    const { result } = renderHook(() => useUpgradeCheckout());

    await act(async () => {
      await result.current.startUpgradeCheckout();
    });

    expect(result.current.error).toBe("server");
    expect(trackEvent).toHaveBeenCalledWith("upgrade_checkout_error_server");
  });

  it("unknown: 200 ok with missing url maps to unknown", async () => {
    authedFetch.mockResolvedValue(makeRes(200, { url: undefined }));

    const useUpgradeCheckout = await loadHook();
    const { result } = renderHook(() => useUpgradeCheckout());

    await act(async () => {
      await result.current.startUpgradeCheckout();
    });

    expect(result.current.error).toBe("unknown");
    expect(trackEvent).toHaveBeenCalledWith("upgrade_checkout_error_unknown");
    expect(hrefCapture).toBe("");
  });

  it("clearError resets error state to null", async () => {
    authedFetch.mockResolvedValue(makeRes(500, {}));

    const useUpgradeCheckout = await loadHook();
    const { result } = renderHook(() => useUpgradeCheckout());

    await act(async () => {
      await result.current.startUpgradeCheckout();
    });
    expect(result.current.error).toBe("server");

    act(() => {
      result.current.clearError();
    });
    expect(result.current.error).toBeNull();
  });

  it("in-flight guard: second call is a no-op + emits blocked event", async () => {
    // Hold the fetch open until we say so, so the second call lands
    // while the first is still mid-flight.
    let resolveFetch: (r: Response) => void = () => {};
    const pending = new Promise<Response>((resolve) => {
      resolveFetch = resolve;
    });
    authedFetch.mockReturnValue(pending);

    const useUpgradeCheckout = await loadHook();
    const { result } = renderHook(() => useUpgradeCheckout());

    // Kick off two concurrent calls.
    let firstCall: Promise<void>;
    let secondCall: Promise<void>;
    await act(async () => {
      firstCall = result.current.startUpgradeCheckout();
      secondCall = result.current.startUpgradeCheckout();
      // Let the second call's synchronous guard branch resolve.
      await Promise.resolve();
    });

    // Only one fetch fired.
    expect(authedFetch).toHaveBeenCalledTimes(1);
    expect(trackEvent).toHaveBeenCalledWith(
      "upgrade_checkout_blocked_in_flight",
    );
    // The blocked-in-flight event fires exactly once for the second call.
    const blockedCalls = trackEvent.mock.calls.filter(
      ([name]) => name === "upgrade_checkout_blocked_in_flight",
    );
    expect(blockedCalls.length).toBe(1);

    // Resolve the held fetch so the test cleans up gracefully.
    await act(async () => {
      resolveFetch(makeRes(200, { url: "https://checkout.stripe.com/x" }));
      await firstCall;
      await secondCall;
    });
  });
});
