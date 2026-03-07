"use client";

import { useEffect } from "react";

export function PWAInitializer() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const register = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js");
        if (registration.waiting) {
          registration.waiting.postMessage({ type: "SKIP_WAITING" });
        }
      } catch (error) {
        console.warn("Service worker registration failed", error);
      }
    };

    register();
  }, []);

  return null;
}
