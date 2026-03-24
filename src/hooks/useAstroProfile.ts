import { useState, useEffect, useRef, useCallback } from "react";
import type { User } from "@supabase/supabase-js";
import { calculateAll, type BirthData, type ApiIssue } from "../services/api";
import { generateInterpretation } from "../services/gemini";
import {
  upsertAstroProfile,
  insertBirthData,
  insertNatalChart,
  fetchAstroProfile,
} from "../services/supabase";
import type { ApiData } from "../types/bafe";
import { parseAstroProfileJson } from "../types/bafe";
import type { TileTexts } from "../types/interpretation";
import { trackEvent } from "../lib/analytics";

function getCalcErrorMessage(lang: string): string {
  if (lang === "en") {
    return "Calculation failed. Please try again.";
  }
  return "Berechnung fehlgeschlagen. Bitte versuche es erneut.";
}

function getAiErrorMessage(lang: string): string {
  if (lang === "en") {
    return "AI generation failed. Please try again.";
  }
  return "KI-Generierung fehlgeschlagen.";
}

export type ProfileState =
  | "idle"       // no user logged in
  | "loading"    // fetching from Supabase
  | "found"      // profile loaded → show Dashboard
  | "not-found"  // no profile → show BirthForm
  | "error";     // fetch failed → show BirthForm as fallback

export interface AstroProfileResult {
  profileState: ProfileState;
  apiData: ApiData | null;
  apiIssues: ApiIssue[];
  interpretation: string | null;
  tileTexts: TileTexts;
  birthDateStr: string | null;
  isFirstReading: boolean;
  isLoading: boolean;
  error: string | null;
  handleSubmit: (data: BirthData) => Promise<void>;
  handleRegenerate: () => Promise<void>;
  handleReset: () => void;
}

export function useAstroProfile(user: User | null, lang: string): AstroProfileResult {
  const [profileState, setProfileState] = useState<ProfileState>("idle");
  const [apiData, setApiData] = useState<ApiData | null>(null);
  const [apiIssues, setApiIssues] = useState<ApiIssue[]>([]);
  const [interpretation, setInterpretation] = useState<string | null>(null);
  const [tileTexts, setTileTexts] = useState<TileTexts>({});
  const [birthDateStr, setBirthDateStr] = useState<string | null>(null);
  const [isFirstReading, setIsFirstReading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const profileFetchedForRef = useRef<string | null>(null);

  // ── Profile loading ──────────────────────────────────────────────────
  useEffect(() => {
    if (!user) {
      setProfileState("idle");
      setApiData(null);
      setInterpretation(null);
      setTileTexts({});
      setBirthDateStr(null);
      setApiIssues([]);
      setError(null);
      setIsFirstReading(false);
      profileFetchedForRef.current = null;
      return;
    }

    if (profileFetchedForRef.current === user.id) return;
    profileFetchedForRef.current = user.id;
    setProfileState("loading");

    fetchAstroProfile(user.id)
      .then(async (profile) => {
        if (profile?.astro_json) {
          const parsed = parseAstroProfileJson(profile.astro_json);
          if (!parsed) {
            setProfileState("not-found");
            return;
          }
          const { apiData: restoredData, interpretation: storedInterpretation, tiles: storedTiles } = parsed;
          setApiData(restoredData);

          if (!storedInterpretation) {
            try {
              const aiResult = await generateInterpretation(restoredData, lang);
              setInterpretation(aiResult.interpretation);
              setTileTexts(aiResult.tiles || {});
            } catch {
              setInterpretation(
                lang === "de"
                  ? "Dein kosmisches Profil wird geladen…"
                  : "Loading your cosmic profile…"
              );
            }
          } else {
            setTileTexts(storedTiles as TileTexts);
            setInterpretation(storedInterpretation);
          }

          if (profile.birth_date) {
            const time = profile.birth_time || "12:00";
            setBirthDateStr(`${profile.birth_date}T${time}:00`);
          }

          setProfileState("found");
        } else {
          setProfileState("not-found");
        }
      })
      .catch((err) => {
        console.error("Profile load failed:", err);
        setProfileState("error");
      });
  }, [user]); // lang intentionally excluded — handled by separate lang-change effect below

  // ── Onboarding submit ────────────────────────────────────────────────
  const handleSubmit = useCallback(async (data: BirthData) => {
    if (!user || profileState === "found") return;

    setIsLoading(true);
    setError(null);
    trackEvent("reading_started");

    try {
      const results = await calculateAll(data);
      setApiData(results);
      setApiIssues(results.issues);
      setBirthDateStr(data.date);

      const aiResult = await generateInterpretation(results, lang);
      setInterpretation(aiResult.interpretation);
      setTileTexts(aiResult.tiles || {});
      trackEvent("reading_completed");

      try {
        await Promise.all([
          upsertAstroProfile(user.id, data, results, aiResult.interpretation, aiResult.tiles || {}),
          insertBirthData(user.id, data),
          insertNatalChart(user.id, results),
        ]);
      } catch (persistErr) {
        console.warn("Supabase persist failed:", persistErr);
      }

      setIsFirstReading(true);
      setProfileState("found");
    } catch (err: unknown) {
      console.error("API Error:", err);
      const msg = err instanceof Error ? err.message : "";
      setError(msg || getCalcErrorMessage(lang));
    } finally {
      setIsLoading(false);
    }
  }, [user, profileState, lang]);

  // ── Regenerate interpretation ────────────────────────────────────────
  const regeneratingRef = useRef(false);
  const handleRegenerate = useCallback(async () => {
    if (!apiData || !user) return;
    if (regeneratingRef.current) return;
    regeneratingRef.current = true;
    setIsLoading(true);
    setError(null);
    try {
      const aiResult = await generateInterpretation(apiData, lang);
      setInterpretation(aiResult.interpretation);
      setTileTexts(aiResult.tiles || {});

      // Persist updated interpretation back to Supabase
      if (birthDateStr) {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        upsertAstroProfile(
          user.id,
          { date: birthDateStr, tz, lat: 0, lon: 0 },
          apiData,
          aiResult.interpretation,
          aiResult.tiles || {},
        ).catch((e) => {
          console.warn("Persist after regenerate failed:", e);
          const msg = lang === 'de' ? 'Profil konnte nicht gespeichert werden.' : 'Profile could not be saved.';
          setError(msg);
          // Auto-clear: regeneration succeeded (data in memory), only persist failed
          setTimeout(() => setError((prev) => prev === msg ? null : prev), 5000);
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      setError(msg || getAiErrorMessage(lang));
    } finally {
      setIsLoading(false);
      regeneratingRef.current = false;
    }
  }, [apiData, lang, user, birthDateStr]);

  // ── Re-generate when language changes for a loaded profile ───────────
  const langRef = useRef<string>(lang);
  useEffect(() => {
    const prevLang = langRef.current;
    langRef.current = lang;
    if (prevLang === lang) return;              // no actual change
    if (profileState !== "found" || !apiData) return; // not loaded yet
    handleRegenerate();
  }, [lang, profileState, apiData, handleRegenerate]);

  // ── Reset (blocked if profile is persisted) ──────────────────────────
  const handleReset = useCallback(() => {
    if (profileState === "found") return;
    setApiData(null);
    setInterpretation(null);
    setTileTexts({});
    setError(null);
    setApiIssues([]);
  }, [profileState]);

  return {
    profileState,
    apiData,
    apiIssues,
    interpretation,
    tileTexts,
    birthDateStr,
    isFirstReading,
    isLoading,
    error,
    handleSubmit,
    handleRegenerate,
    handleReset,
  };
}
