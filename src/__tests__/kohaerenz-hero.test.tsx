/**
 * Tests for KohaerenzHero — coherence index display with Impact API integration.
 *
 * Verifies:
 * - Impact harmony_index (0-100) takes precedence over dayHarmonic (0-1)
 * - Fallback to dayHarmonic when impact unavailable
 * - Loading states for both data sources
 * - Ring displays correct percentage value
 * - CON-no-unexplained-numbers: value is accompanied by label
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { KohaerenzHero } from '@/src/components/dashboard/KohaerenzHero';

// Mock LanguageContext
vi.mock('@/src/contexts/LanguageContext', () => ({
  useLanguage: () => ({ lang: 'de' }),
}));

const defaultProps = {
  dayHarmonic: { harmonyIndex: 0.45, mode: 'pulse' as const, intensity: 0.5 },
  spaceWeather: {
    kpIndex: 2,
    solarPressure: 0.3,
    ringModulation: 1.0,
    loading: false,
    error: null,
    lastUpdated: null,
    gScale: null,
  },
  transitEvents: [],
  dayMode: 'pulse' as const,
  loading: false,
};

describe('KohaerenzHero', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Impact API integration (REQ-F-coherence-hero-impact-datasource)', () => {
    it('displays impactHarmonyIndex when available (0-100 → ring shows percentage)', () => {
      render(
        <KohaerenzHero
          {...defaultProps}
          impactHarmonyIndex={72}
          impactLoading={false}
        />
      );
      // Ring should show 72 (from impact, not 45 from dayHarmonic)
      expect(screen.getByText('72')).toBeDefined();
    });

    it('falls back to dayHarmonic.harmonyIndex when impact unavailable', () => {
      render(
        <KohaerenzHero
          {...defaultProps}
          impactHarmonyIndex={null}
          impactLoading={false}
        />
      );
      // Ring should show 45 (from dayHarmonic 0.45 * 100)
      expect(screen.getByText('45')).toBeDefined();
    });

    it('falls back to dayHarmonic when impactHarmonyIndex prop is not passed', () => {
      render(<KohaerenzHero {...defaultProps} />);
      // Ring should show 45 (from dayHarmonic 0.45 * 100)
      expect(screen.getByText('45')).toBeDefined();
    });

    it('shows 0 when both sources are null/zero', () => {
      render(
        <KohaerenzHero
          {...defaultProps}
          dayHarmonic={null}
          impactHarmonyIndex={null}
          impactLoading={false}
          loading={false}
        />
      );
      expect(screen.getByText('0')).toBeDefined();
    });
  });

  describe('loading states', () => {
    it('shows skeleton when impact is loading and no data yet', () => {
      const { container } = render(
        <KohaerenzHero
          {...defaultProps}
          impactHarmonyIndex={null}
          impactLoading={true}
          loading={false}
        />
      );
      expect(container.querySelector('.animate-pulse')).not.toBeNull();
    });

    it('shows content when impact loaded even if transit still loading', () => {
      render(
        <KohaerenzHero
          {...defaultProps}
          impactHarmonyIndex={65}
          impactLoading={false}
          loading={true}
        />
      );
      expect(screen.getByText('65')).toBeDefined();
    });
  });

  describe('CON-no-unexplained-numbers', () => {
    it('displays "Kohärenzindex" label alongside the numerical value', () => {
      render(
        <KohaerenzHero
          {...defaultProps}
          impactHarmonyIndex={58}
          impactLoading={false}
        />
      );
      expect(screen.getByText('Kohärenzindex')).toBeDefined();
      expect(screen.getByText('58')).toBeDefined();
    });

    it('displays a contextualising title (Hohe/Mittlere/Niedrige Übereinstimmung)', () => {
      render(
        <KohaerenzHero
          {...defaultProps}
          impactHarmonyIndex={75}
          impactLoading={false}
        />
      );
      expect(screen.getByText('Hohe Übereinstimmung')).toBeDefined();
    });
  });

  describe('driver strip', () => {
    it('renders 4 driver pills (Geomagnetik, Solardruck, Transit-Aktivität, Tagesfeld)', () => {
      render(
        <KohaerenzHero
          {...defaultProps}
          impactHarmonyIndex={50}
          impactLoading={false}
        />
      );
      expect(screen.getByText('Geomagnetik')).toBeDefined();
      expect(screen.getByText('Solardruck')).toBeDefined();
      expect(screen.getByText('Transit-Aktivität')).toBeDefined();
      expect(screen.getByText('Tagesfeld')).toBeDefined();
    });
  });
});
