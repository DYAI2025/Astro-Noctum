import { supabase } from "../lib/supabase";

// ── Types ───────────────────────────────────────────────────────────

export interface BirthInput {
  date: string;
  tz: string;
  lon: number;
  lat: number;
  place?: string;
}

// ── Insert astro_profiles (write-once, never overwrite) ─────────────
// Stores the main profile row that ElevenLabs reads via /api/profile/:userId.
// If a profile already exists for this user, the insert is silently skipped.

export async function upsertAstroProfile(
  userId: string,
  birth: BirthInput,
  bafeData: any,
  interpretation: string,
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
    astro_json: { bafe: bafeData, interpretation },
    astro_computed_at: new Date().toISOString(),
  });

  if (error) {
    // 23505 = unique_violation — profile already exists, skip silently
    if (error.code === "23505") return;
    console.error("insertAstroProfile error:", error);
    throw error;
  }
}

// ── Insert birth_data ───────────────────────────────────────────────

export async function insertBirthData(userId: string, birth: BirthInput) {
  const { error } = await supabase.from("birth_data").insert({
    user_id: userId,
    birth_utc: birth.date,
    lat: birth.lat,
    lon: birth.lon,
    place_label: birth.place || null,
  });

  if (error) {
    // Duplicate? Ignore — user may recalculate
    if (error.code === "23505") return;
    console.error("insertBirthData error:", error);
    throw error;
  }
}

// ── Insert natal_charts ─────────────────────────────────────────────

export async function insertNatalChart(userId: string, bafeData: any) {
  const { error } = await supabase.from("natal_charts").insert({
    user_id: userId,
    payload: bafeData,
    engine_version: "bafe-1.0",
    zodiac: "tropical",
    house_system: "placidus",
  });

  if (error) {
    console.error("insertNatalChart error:", error);
    throw error;
  }
}

// ── Fetch profile (client-side, for re-display on revisit) ──────────

export async function fetchAstroProfile(userId: string) {
  const { data, error } = await supabase
    .from("astro_profiles")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null; // not found
    console.error("fetchAstroProfile error:", error);
    return null;
  }
  return data;
}
