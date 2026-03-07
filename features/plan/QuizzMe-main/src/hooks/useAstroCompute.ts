"use client";

import { useState } from "react";

export function useAstroCompute() {
  const [computing, setComputing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function compute(force = false) {
    setComputing(true);
    setError(null);
    try {
      const res = await fetch("/api/astro-compute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ force }),
      });
      const data = await res.json();
      
      if (!res.ok) {
        // Pass through specific error codes for checking in UI (e.g. AMBIGUOUS_LOCAL_TIME)
        const err: any = new Error(data.error || "Compute failed");
        err.code = data.code; 
        err.details = data.details;
        throw err;
      }
      return data; 
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setComputing(false);
    }
  }

  return { compute, computing, error };
}
