/**
 * API Module (Client-Only)
 *
 * Client-side API for UI components.
 * Automatically detects static vs server mode.
 *
 * Note: Server-side service functions (contributeService, getSnapshotService)
 * should be imported directly from "./contribute-service" in API routes
 * to avoid bundling server-side code in client bundles.
 */

// Client-side API (for UI components)
export {
  contribute as contributeClient,
  getSnapshot as getSnapshotClient,
  getProfileState,
  getClientMode,
  resetLocalProfile,
  type ContributeClientResult,
  type GetSnapshotResult as ClientGetSnapshotResult,
} from "./contribute-client";
