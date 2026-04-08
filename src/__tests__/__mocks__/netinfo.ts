// NetInfo stub — overridden per-test via vi.mock
export default {
  fetch: async () => ({ isConnected: false }),
  addEventListener: (_cb: unknown) => () => {},
};
