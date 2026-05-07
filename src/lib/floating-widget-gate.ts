/**
 * Single-CTA invariant gate (Phase D2 of dashboard CTA consolidation).
 *
 * Decides whether the global <AgentFloatingWidget/> should mount for the
 * current user + route. Extracted from App.tsx so it can be unit-tested
 * without pulling the BrowserRouter / context tree.
 *
 * Rules:
 *   • Premium users  →  always visible (their voice-agent shortcut on
 *                       every route).
 *   • Free users     →  visible only on `/signatur`, where the existing
 *                       <PremiumUpgradeModal/> handles contextual upsell
 *                       when they tap a locked cluster (different intent
 *                       from the dashboard's bottom upgrade card).
 *   • Free users on `/` (or any other route) → hidden, so the bottom
 *     dashboard CTA is the sole upgrade affordance (TASK-1.3
 *     single-CTA invariant).
 */
export function shouldShowFloatingWidget(
  isPremium: boolean,
  pathname: string,
): boolean {
  if (isPremium) return true;
  return pathname === '/signatur';
}
