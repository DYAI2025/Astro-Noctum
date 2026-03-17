import * as Application from "expo-application";
import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const DEVICE_ID_KEY = "bazodiac_mobile_device_id";

function generateFallbackId(): string {
  return `dev-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

const WebDeviceStorage = {
  getItem: async (key: string): Promise<string | null> => {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(key);
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(key, value);
  },
};

const NativeDeviceStorage = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
};

const deviceStorage = Platform.OS === "web" ? WebDeviceStorage : NativeDeviceStorage;

export async function getOrCreateDeviceId(): Promise<string> {
  const existing = await deviceStorage.getItem(DEVICE_ID_KEY);
  if (existing) return existing;

  let nativeId: string | null = null;

  try {
    if (Platform.OS === "android") {
      nativeId = Application.getAndroidId?.() || null;
    } else if (Platform.OS === "ios") {
      nativeId = await Application.getIosIdForVendorAsync();
    }
  } catch {
    nativeId = null;
  }

  if (!nativeId) {
    nativeId = generateFallbackId();
  }
  await deviceStorage.setItem(DEVICE_ID_KEY, nativeId);
  return nativeId;
}

export function getAppPlatform(): string {
  return Platform.OS;
}

export function getAppVersion(): string {
  return Constants.expoConfig?.version || "dev";
}
