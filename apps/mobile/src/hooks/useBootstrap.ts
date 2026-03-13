import { useEffect, useState } from "react";
import type { MobileBootstrap } from "@bazodiac/shared";
import { fetchMobileBootstrap } from "../lib/api";

type BootstrapState = {
  bootstrap: MobileBootstrap | null;
  loading: boolean;
  error: string | null;
};

export function useBootstrap(): BootstrapState {
  const [bootstrap, setBootstrap] = useState<MobileBootstrap | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const run = async () => {
      try {
        const response = await fetchMobileBootstrap();
        if (!active) return;
        setBootstrap(response);
        setError(null);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Bootstrap failed");
      } finally {
        if (active) setLoading(false);
      }
    };

    void run();

    return () => {
      active = false;
    };
  }, []);

  return { bootstrap, loading, error };
}
