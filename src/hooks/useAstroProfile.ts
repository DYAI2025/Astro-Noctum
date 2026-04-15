import { useState, useEffect, useRef, useCallback } from "react";
import type { User } from "@supabase/supabase-js";
import { calculateAll, type BirthData, type ApiIssue } from "../services/api";
import { generateInterpretation } from "../services/gemini";
import {
  upsertAstroProfile,
  insertBirthData,
  insertNatalChart,
  fetchAstroProfile,
  deleteAstroProfile,
} from "../services/supabase";
import type { ApiData } from "../types/bafe";
import { parseAstroProfileJson } from "../types/bafe";
import type { TileTexts } from "../types/interpretation";
import { trackEvent } from "../lib/analytics";
import { retryWithBackoff } from "../lib/retryWithBackoff";

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
  persistError: string | null;
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
  const [persistError, setPersistError] = useState<string | null>(null);

  const profileFetchedForRef = useRef<string | null>(null);
  const birthInputRef = useRef<{ date: string; tz: string; lat: number; lon: number } | null>(null);

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
            console.warn('[AstroProfile] Corrupted astro_json for user', user.id, '— deleting row');
            deleteAstroProfile(user.id).catch((e) =>
              console.error('[AstroProfile] Failed to delete corrupted row:', e)
            );
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
            } catch (err) {
              console.warn('[AstroProfile] AI interpretation failed:', err instanceof Error ? err.message : err);
              setInterpretation(
                lang === "de"
                  ? "Die KI-Synthese konnte nicht geladen werden. Bitte versuche es später erneut."
                  : "The AI synthesis could not be loaded. Please try again later."
              );
            }
          } else {
            setTileTexts(storedTiles as TileTexts);
            setInterpretation(storedInterpretation);
          }

          if (profile.birth_date) {
            const time = profile.birth_time || "12:00";
            const dateStr = `${profile.birth_date}T${time}:00`;
            setBirthDateStr(dateStr);
            birthInputRef.current = {
              date: dateStr,
              tz: profile.iana_time_zone || Intl.DateTimeFormat().resolvedOptions().timeZone,
              lat: profile.birth_lat ?? 0,
              lon: profile.birth_lng ?? 0,
            };
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

  // ── Auto-recalc: if profile exists but critical fields are null ──────
  useEffect(() => {
    if (profileState !== 'found') return;
    if (!user) return;
    // Check if critical fields need backfill
    const needsRecalc = apiData && (
      !apiData.western?.zodiac_sign ||
      !apiData.western?.moon_sign ||
      !apiData.bazi?.day_master
    );
    if (!needsRecalc) return;
    // Only auto-recalc once per session
    const recalcKey = `bazodiac_auto_recalc:${user.id}`;
    if (sessionStorage.getItem(recalcKey)) return;
    sessionStorage.setItem(recalcKey, '1');

    // Re-trigger calculation with stored birth data
    const birthInput = birthInputRef.current;
    if (!birthInput?.date || !birthInput?.tz) return;

    console.info('[useAstroProfile] Auto-recalc: critical fields missing, re-calculating...');
    calculateAll({ date: birthInput.date, tz: birthInput.tz, lat: birthInput.lat, lon: birthInput.lon })
      .then(results => {
        setApiData(results);
        return upsertAstroProfile(user.id, birthInput, results, interpretation ?? '', tileTexts);
      })
      .then(() => console.info('[useAstroProfile] Auto-recalc complete'))
      .catch(err => console.warn('[useAstroProfile] Auto-recalc failed:', err));
  }, [profileState, user, apiData, interpretation, tileTexts]);

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
        await retryWithBackoff(async () => {
          await Promise.all([
            upsertAstroProfile(user.id, data, results, aiResult.interpretation, aiResult.tiles || {}),
            insertBirthData(user.id, data),
            insertNatalChart(user.id, results),
          ]);
        }, { maxRetries: 3, baseDelay: 1000 });
        setPersistError(null);
      } catch (persistErr) {
        console.error('[useAstroProfile] Persist failed after retries:', persistErr);
        setPersistError('Deine Daten konnten nicht gespeichert werden. Bitte lade die Seite neu.');
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
    persistError,
    handleSubmit,
    handleRegenerate,
    handleReset,
  };
}
