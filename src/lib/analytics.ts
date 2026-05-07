declare global {
  interface Window { gtag: (...args: unknown[]) => void; }
}

type EventName =
  | 'signup'
  | 'login'
  | 'reading_started'
  | 'reading_completed'
  | 'upgrade_clicked'
  | 'upgrade_checkout_started'
  | 'upgrade_checkout_success_redirect'
  | 'upgrade_checkout_error_auth_required'
  | 'upgrade_checkout_error_already_premium'
  | 'upgrade_checkout_error_network'
  | 'upgrade_checkout_error_stripe_unavailable'
  | 'upgrade_checkout_error_server'
  | 'upgrade_checkout_error_unknown'
  | 'upgrade_checkout_blocked_in_flight'
  | 'payment_completed'
  | 'share_clicked'
  | 'signature_reveal_seen'
  | 'signature_delta_applied'
  | 'day_mode_modal_opened'
  | 'day_mode_modal_closed'
  | 'vibes_opened'
  | 'vibes_closed'
  | 'vibes_explain_opened'
  | 'weekly_opened'
  | 'weekly_area_explain_opened';

export function trackEvent(event: EventName, params?: Record<string, string | number>) {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag('event', event, params);
  }
}
