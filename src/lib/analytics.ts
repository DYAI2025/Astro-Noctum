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
  | 'share_clicked';

export function trackEvent(event: EventName, params?: Record<string, string | number>) {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag('event', event, params);
  }
}
