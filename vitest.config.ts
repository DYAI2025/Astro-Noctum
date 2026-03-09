import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "happy-dom",
    globals: true,
    setupFiles: ["./src/test-setup.tsx"],
    include: ["src/**/__tests__/**/*.{test,spec}.{ts,tsx}"],
    coverage: {
      reporter: ["text", "html"],
      include: ["src/lib/astro-data/**", "src/contexts/**", "src/lib/fusion-ring/**", "src/lib/lme/**"],
    },
  },
  resolve: {
    alias: { "@": resolve(__dirname, ".") },
  },
});
