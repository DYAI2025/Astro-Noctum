import { supabase } from "./supabase";

export interface BirthInput {
  date: string;
  tz: string;
  lon: number;
  lat: number;
  place?: string;
}

export type ReadingPayload = {
  bazi: unknown;
  western: unknown;
  fusion: unknown;
  wuxing: unknown;
  tst: unknown;
};

export async function fetchAstroProfile(userId: string) {
  const { data, error } = await supabase
    .from("astro_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function fetchTier(userId: string): Promise<"free" | "premium"> {
  const { data, error } = await supabase
    .from("profiles")
    .select("tier")
    .eq("id", userId)
    .single();

  if (error) {
    return "free";
  }

  return data?.tier === "premium" ? "premium" : "free";
}

export async function persistReading(
  userId: string,
  birth: BirthInput,
  reading: ReadingPayload,
  interpretation: string,
): Promise<void> {
  const western = reading.western as any;
  const sunSign = western?.zodiac_sign || null;
  const moonSign = western?.moon_sign || null;
  const ascSign = western?.ascendant_sign || null;

  const { error: profileError } = await supabase.from("astro_profiles").insert({
    user_id: userId,
    birth_date: birth.date.split("T")[0],
    birth_time: birth.date.includes("T") ? birth.date.split("T")[1]?.slice(0, 5) : null,
    iana_time_zone: birth.tz,
    birth_lat: birth.lat,
    birth_lng: birth.lon,
    birth_place_name: birth.place || null,
    sun_sign: sunSign,
    moon_sign: moonSign,
    asc_sign: ascSign,
    astro_json: {
      ...reading,
      interpretation,
    },
    astro_computed_at: new Date().toISOString(),
  });

  if (profileError && profileError.code !== "23505") {
    throw profileError;
  }

  const { error: birthError } = await supabase.from("birth_data").insert({
    user_id: userId,
    birth_utc: birth.date,
    lat: birth.lat,
    lon: birth.lon,
    place_label: birth.place || null,
  });
  if (birthError && birthError.code !== "23505") {
    throw birthError;
  }

  const { error: chartError } = await supabase.from("natal_charts").insert({
    user_id: userId,
    payload: reading,
    engine_version: "bafe-1.0",
    zodiac: "tropical",
    house_system: "placidus",
  });
  if (chartError && chartError.code !== "23505") {
    throw chartError;
  }
}
