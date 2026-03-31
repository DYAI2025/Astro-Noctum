import { describe, it, expect } from 'vitest';
import { formatCooldown } from '../lib/format-cooldown';

describe('formatCooldown', () => {
  it('shows hours + minutes for >1h', () => {
    expect(formatCooldown(2 * 60 * 60 * 1000 + 15 * 60 * 1000, 'de')).toBe('2h 15min');
  });

  it('shows only minutes for <1h DE', () => {
    expect(formatCooldown(45 * 60 * 1000, 'de')).toBe('45 Min.');
  });

  it('shows only minutes for <1h EN', () => {
    expect(formatCooldown(45 * 60 * 1000, 'en')).toBe('45 min');
  });

  it('rounds up to at least 1 minute', () => {
    expect(formatCooldown(30 * 1000, 'de')).toBe('1 Min.');
  });

  it('handles zero', () => {
    expect(formatCooldown(0, 'de')).toBe('0 Min.');
  });
});
