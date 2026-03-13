import Constants from "expo-constants";

const appConfig = Constants.expoConfig?.extra ?? {};

export const mobileConfig = {
  apiBaseUrl:
    process.env.EXPO_PUBLIC_API_BASE_URL ||
    (typeof appConfig.apiBaseUrl === "string" ? appConfig.apiBaseUrl : "https://bazodiac.space"),
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL || "",
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "",
  googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || "",
};

export function assertMobileEnv(): void {
  const missing: string[] = [];
  if (!mobileConfig.supabaseUrl) missing.push("EXPO_PUBLIC_SUPABASE_URL");
  if (!mobileConfig.supabaseAnonKey) missing.push("EXPO_PUBLIC_SUPABASE_ANON_KEY");

  if (missing.length > 0) {
    throw new Error(`Missing required mobile env vars: ${missing.join(", ")}`);
  }
}
