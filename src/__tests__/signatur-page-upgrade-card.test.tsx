import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

// ── Premium hook mock with mutable state ──────────────────────────────
const mockPremiumState: { isPremium: boolean } = { isPremium: false };
vi.mock('@/src/hooks/usePremium', () => ({
  usePremium: () => ({
    isPremium: mockPremiumState.isPremium,
    loading: false,
  }),
}));

// ── Upgrade checkout hook mock (transitive via UpgradeButton) ─────────
const startUpgradeCheckout = vi.fn();
const clearError = vi.fn();
vi.mock('@/src/hooks/useUpgradeCheckout', () => ({
  useUpgradeCheckout: () => ({
    startUpgradeCheckout,
    isLoading: false,
    error: null,
    clearError,
  }),
}));

// ── Auth mock (transitive via UpgradeButton -> useUpgradeCheckout) ────
vi.mock('@/src/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'u1' } }),
}));

// ── i18n mock — return recognizable strings per key ───────────────────
const I18N_MAP: Record<string, string> = {
  'signatur.upgradeCard.title': 'Schalte deine volle Signatur-Erfahrung frei',
  'signatur.upgradeCard.subtitle': 'Premium-Cluster, erweiterte Quizzes und mehr',
  'dashboard.premium.cta': 'Upgrade — 4,99 €',
};

vi.mock('@/src/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    t: (key: string) => I18N_MAP[key] ?? key,
    lang: 'de',
    setLang: vi.fn(),
  }),
}));

// Importing AFTER mocks are registered.
import { SignaturUpgradeCard } from '../components/signatur/SignaturUpgradeCard';

describe('SignaturUpgradeCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPremiumState.isPremium = false;
  });

  it('SUC-001: free user sees the upgrade card with title + subtitle + button', () => {
    render(<SignaturUpgradeCard />);
    expect(screen.getByTestId('signatur-upgrade-card')).toBeInTheDocument();
    expect(
      screen.getByText('Schalte deine volle Signatur-Erfahrung frei'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Premium-Cluster, erweiterte Quizzes und mehr'),
    ).toBeInTheDocument();
    // Exactly one button: the UpgradeButton
    expect(screen.getAllByRole('button')).toHaveLength(1);
  });

  it('SUC-002: premium user sees nothing (component returns null)', () => {
    mockPremiumState.isPremium = true;
    const { container } = render(<SignaturUpgradeCard />);
    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByTestId('signatur-upgrade-card')).toBeNull();
  });

  it('SUC-003: card contains exactly ONE UpgradeButton (single-CTA invariant on /signatur)', () => {
    render(<SignaturUpgradeCard />);
    const upgradeButtons = screen.getAllByRole('button', {
      name: /upgrade|premium freischalten|abo/i,
    });
    expect(upgradeButtons).toHaveLength(1);
  });
});
