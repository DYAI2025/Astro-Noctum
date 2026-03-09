/**
 * Storage Module
 *
 * Provides persistence for profile state and event audit logs.
 *
 * Implementations:
 * - json-store: File-based JSON storage for server mode
 * - memory-store: In-memory storage for testing
 * - localstorage-store: Browser localStorage for static export mode
 */

export * from "./store-types";
export * from "./json-store";
export * from "./memory-store";
export * from "./localstorage-store";
