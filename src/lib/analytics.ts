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
  | 'daily_modal_opened'
  | 'daily_modal_closed'
  | 'daily_tab_changed'
  | 'day_mode_modal_opened'
  | 'day_mode_modal_closed';

export function trackEvent(event: EventName, params?: Record<string, string | number>) {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag('event', event, params);
  }
}
