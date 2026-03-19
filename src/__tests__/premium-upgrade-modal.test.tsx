// src/__tests__/premium-upgrade-modal.test.tsx
import { describe, it, expect, vi } from 'vitest';

vi.mock('@/src/contexts/LanguageContext', () => ({
  useLanguage: () => ({ t: (k: string) => k, lang: 'de' as const }),
}));
vi.mock('@/src/components/UpgradeButton', () => ({
  UpgradeButton: ({ label }: { label?: string }) => <button>{label ?? 'Upgrade'}</button>,
}));

describe('PremiumUpgradeModal', () => {
  it('exports a component', async () => {
    const mod = await import('@/src/components/signatur/PremiumUpgradeModal');
    expect(mod.PremiumUpgradeModal).toBeDefined();
  });
});
