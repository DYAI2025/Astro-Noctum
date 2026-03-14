import { supabase } from "../lib/supabase";
import type { ApiResults } from "./api";
import type { TileTexts, HouseTexts } from "../types/interpretation";

// ── Types ───────────────────────────────────────────────────────────

export interface BirthInput {
  date: string;
  tz: string;
  lon: number;
  lat: number;
  place?: string;
}

/** Alias for the full BAFE engine response used for storage and display */
export type BafeData = ApiResults;

// ── Fetch profile (client-side, for re-display on revisit) ──────────
// Returns the single astro_profile row for this user, or null.

export async function fetchAstroProfile(userId: string) {
  const { data, error } = await supabase
    .from("astro_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();    // maybeSingle returns null without error if not found

  if (error) {
    console.error("fetchAstroProfile error:", error);
    return null;
  }
  return data;
}

// ── Insert astro_profiles (write-once, NEVER overwrite) ─────────────
// astro_profiles.user_id is PRIMARY KEY → only one row per user.
// If a profile already exists, the insert is silently skipped (23505).

export async function upsertAstroProfile(
  userId: string,
  birth: BirthInput,
  bafeData: BafeData,
  interpretation: string,
  tiles: TileTexts = {},
  houses: HouseTexts = {},
) {
  const sunSign = bafeData.western?.zodiac_sign || null;
  const moonSign = bafeData.western?.moon_sign || null;
  const ascSign = bafeData.western?.ascendant_sign || null;

  const { error } = await supabase.from("astro_profiles").insert({
    user_id: userId,
    birth_date: birth.date.split("T")[0],
    birth_time: birth.date.includes("T")
      ? birth.date.split("T")[1]?.slice(0, 5)
      : null,
    iana_time_zone: birth.tz,
    birth_lat: birth.lat,
    birth_lng: birth.lon,
    birth_place_name: birth.place || null,
    sun_sign: sunSign,
    moon_sign: moonSign,
    asc_sign: ascSign,
    astro_json: {
      bazi:    bafeData.bazi,
      western: bafeData.western,
      fusion:  bafeData.fusion,
      wuxing:  bafeData.wuxing,
      tst:     bafeData.tst,
      interpretation,
      tiles,
      houses,
    },
    astro_computed_at: new Date().toISOString(),
  });

  if (error) {
    if (error.code === "23505") return;  // already exists — expected
    console.error("insertAstroProfile error:", error);
    throw error;
  }
}

// ── Insert birth_data (write-once per user) ─────────────────────────

export async function insertBirthData(userId: string, birth: BirthInput) {
  const { error } = await supabase.from("birth_data").insert({
    user_id: userId,
    birth_utc: birth.date,
    lat: birth.lat,
    lon: birth.lon,
    place_label: birth.place || null,
  });

  if (error) {
    if (error.code === "23505") return;  // already exists
    console.error("insertBirthData error:", error);
    throw error;
  }
}

// ── Insert natal_charts (write-once per user) ───────────────────────

export async function insertNatalChart(userId: string, bafeData: BafeData) {
  const { error } = await supabase.from("natal_charts").insert({
    user_id: userId,
    payload: bafeData,
    engine_version: "bafe-1.0",
    zodiac: "tropical",
    house_system: "placidus",
  });

  if (error) {
    if (error.code === "23505") return;  // already exists
    console.error("insertNatalChart error:", error);
    throw error;
  }
}
