"use client";

import React from "react";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { PWAInitializer } from "@/components/pwa/PWAInitializer";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <PWAInitializer />
      {children}
    </ThemeProvider>
  );
}
