/**
 * Format a cooldown duration (in milliseconds) as a human-readable string.
 * @param ms - Remaining cooldown in milliseconds
 * @param lang - Language code ('de' or 'en')
 * @returns Formatted string, e.g. "2h 15min" or "45 Min."
 */
export function formatCooldown(ms: number, lang: string): string {
  if (ms <= 0) {
    return lang === 'de' ? '0 Min.' : '0 min';
  }
  const hours = Math.floor(ms / (60 * 60 * 1000));
  const minutes = Math.max(1, Math.ceil((ms % (60 * 60 * 1000)) / (60 * 1000)));
  if (hours > 0) {
    return `${hours}h ${minutes}min`;
  }
  return lang === 'de' ? `${minutes} Min.` : `${minutes} min`;
}
