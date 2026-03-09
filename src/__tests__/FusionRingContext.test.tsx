import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import type { ReactNode } from 'react';

// Mock Supabase-dependent modules
vi.mock('../services/contribution-events', () => ({
  saveContributionEvent: vi.fn().mockResolvedValue(undefined),
  loadUserEvents: vi.fn().mockResolvedValue([]),
}));

import { FusionRingProvider, useFusionRingContext } from '../contexts/FusionRingContext';

describe('FusionRingContext', () => {
  it('provides signal, addQuizResult, and completedModules', () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <FusionRingProvider apiResults={null} userId={undefined}>
        {children}
      </FusionRingProvider>
    );
    const { result } = renderHook(() => useFusionRingContext(), { wrapper });
    expect(result.current.signal).toBeDefined();
    expect(typeof result.current.addQuizResult).toBe('function');
    expect(result.current.completedModules).toBeDefined();
  });

  it('throws when used outside provider', () => {
    expect(() => {
      renderHook(() => useFusionRingContext());
    }).toThrow('useFusionRingContext must be inside FusionRingProvider');
  });
});
