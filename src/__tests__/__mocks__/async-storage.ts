// AsyncStorage stub — overridden per-test via vi.mock
const store: Record<string, string> = {};
export default {
  getItem:    async (key: string) => store[key] ?? null,
  setItem:    async (key: string, value: string) => { store[key] = value; },
  removeItem: async (key: string) => { delete store[key]; },
  clear:      async () => { Object.keys(store).forEach(k => delete store[k]); },
};
