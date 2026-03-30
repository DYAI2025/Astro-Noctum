declare global {
  interface Window { gtag: (...args: unknown[]) => void; }
}

type EventName =
  | 'signup'
  | 'login'
  | 'reading_started'
  | 'reading_completed'
  | 'upgrade_clicked'
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
