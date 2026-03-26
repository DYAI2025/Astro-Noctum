import { describe, it, expect, vi } from 'vitest';

// Prevent Supabase client initialization (requires env vars not available in tests)
vi.mock('@/src/lib/supabase', () => ({
  supabase: {
    auth: { getSession: vi.fn(), onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })) },
    from: vi.fn(() => ({ select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn() })),
  },
}));

// Prevent other heavy module side effects
vi.mock('@/src/contexts/AuthContext', () => ({ useAuth: vi.fn() }));
vi.mock('@/src/contexts/LanguageContext', () => ({ useLanguage: vi.fn(() => ({ lang: 'de', setLang: vi.fn(), t: vi.fn() })) }));
vi.mock('@/src/hooks/useAmbientePlayer', () => ({ useAmbientePlayer: vi.fn(() => ({ playing: false, volume: 0.5, setVolume: vi.fn(), toggle: vi.fn(), start: vi.fn(), pause: vi.fn(), resume: vi.fn() })) }));
vi.mock('@/src/hooks/useAstroProfile', () => ({ useAstroProfile: vi.fn() }));
vi.mock('@/src/hooks/usePremium', () => ({ usePremium: vi.fn(() => ({ isPremium: false })) }));
vi.mock('@/src/contexts/PlanetariumContext', () => ({ usePlanetarium: vi.fn(() => ({ planetariumMode: false, togglePlanetarium: vi.fn() })) }));
vi.mock('@/src/contexts/FusionRingContext', () => ({ FusionRingProvider: ({ children }: any) => children }));
vi.mock('@/src/contexts/AppLayoutContext', () => ({ AppLayoutProvider: ({ children }: any) => children }));
vi.mock('@/src/contexts/LeviContext', () => ({ LeviProvider: ({ children }: any) => children, useLevi: vi.fn(() => ({ active: false, setExpanded: vi.fn(), setIsPremium: vi.fn() })) }));
vi.mock('@/src/components/LeviFloatingWidget', () => ({ LeviFloatingWidget: () => null }));
vi.mock('@/src/router', () => ({ AppRoutes: () => null }));
vi.mock('@/src/services/experience', () => ({ bootstrapExperience: vi.fn() }));
vi.mock('@/src/lib/analytics', () => ({ trackEvent: vi.fn() }));
vi.mock('@/src/lib/feature-flags', () => ({ isFeatureEnabled: vi.fn(() => false) }));
vi.mock('@/src/components/Splash', () => ({ Splash: () => null }));
vi.mock('@/src/components/AuthGate', () => ({ AuthGate: () => null }));

import { isBootstrapFallback } from '../App';

describe('isBootstrapFallback', () => {
  it('returns true for fallback seed', () => {
    expect(isBootstrapFallback('fallback:1711234567890')).toBe(true);
  });

  it('returns false for a real seed', () => {
    expect(isBootstrapFallback('bazi:wood-dragon:2025')).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(isBootstrapFallback('')).toBe(false);
  });
});
