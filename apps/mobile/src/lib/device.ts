import * as Application from "expo-application";
import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const DEVICE_ID_KEY = "bazodiac_mobile_device_id";

function generateFallbackId(): string {
  return `dev-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export async function getOrCreateDeviceId(): Promise<string> {
  const existing = await SecureStore.getItemAsync(DEVICE_ID_KEY);
  if (existing) return existing;

  const nativeId = Application.getAndroidId?.() || Application.getIosIdForVendor?.() || generateFallbackId();
  await SecureStore.setItemAsync(DEVICE_ID_KEY, nativeId);
  return nativeId;
}

export function getAppPlatform(): string {
  return Platform.OS;
}

export function getAppVersion(): string {
  return Constants.expoConfig?.version || "dev";
}
