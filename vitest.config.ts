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
    // Stub React Native and Expo modules so mobile code can be tested in Node
    server: {
      deps: {
        inline: [/apps\/mobile/],
      },
    },
    coverage: {
      reporter: ["text", "html"],
      include: ["src/lib/astro-data/**", "src/contexts/**", "src/lib/fusion-ring/**", "src/lib/lme/**"],
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "."),
      // Stub React Native / Expo modules for mobile unit tests running in Node
      "react-native": resolve(__dirname, "src/__tests__/__mocks__/react-native.ts"),
      "react-native-url-polyfill/auto": resolve(__dirname, "src/__tests__/__mocks__/empty.ts"),
      "expo-secure-store": resolve(__dirname, "src/__tests__/__mocks__/empty.ts"),
      "@react-native-async-storage/async-storage": resolve(__dirname, "src/__tests__/__mocks__/async-storage.ts"),
      "@react-native-community/netinfo": resolve(__dirname, "src/__tests__/__mocks__/netinfo.ts"),
    },
  },
});
