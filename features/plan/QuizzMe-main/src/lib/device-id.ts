/**
 * Device ID utility for anonymous user identification
 * Generates and persists a unique device ID in localStorage
 */

const DEVICE_ID_KEY = 'quizzme_device_id';

/**
 * Get or create a unique device ID
 * Used for anonymous user identification in Supabase
 */
export function getDeviceId(): string {
  if (typeof window === 'undefined') {
    // Server-side: return empty string (should use header from client)
    return '';
  }

  let deviceId = localStorage.getItem(DEVICE_ID_KEY);
  
  if (!deviceId) {
    deviceId = generateDeviceId();
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  
  return deviceId;
}

/**
 * Generate a unique device ID
 * Format: qm_[timestamp]_[random]
 */
function generateDeviceId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `qm_${timestamp}_${random}`;
}

/**
 * Clear the device ID (for testing or user reset)
 */
export function clearDeviceId(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(DEVICE_ID_KEY);
  }
}
