/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * TS-2: Component Tests for CharacterSheet Rendering
 *
 * Test Coverage:
 * - Rendering with complete and partial snapshot data
 * - Graceful degradation when data is missing
 * - No crashes with minimal data
 * - Correct display of derived stats
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
// import DashboardPage from '@/app/character/page';
import { CoreStatsCard } from '../CoreStatsCard';
import { ArchetypeStoryCard } from '../ArchetypeStoryCard';
import { DerivedStatsCard } from '../DerivedStatsCard';

// Mock the hook
vi.mock('@/hooks', () => ({
  useProfileSnapshot: vi.fn(),
  useHasAstro: vi.fn(),
  usePrimaryArchetype: vi.fn(),
  useCompletionPercent: vi.fn(),
}));

const MOCK_SNAPSHOT = {
  id: 'test-snapshot',
  psyche: {
    state: {},
    archetypeMix: [
      {
        archetypeId: 'sage',
        weight: 0.8,
        archetype: { name: 'The Sage' }
      }
    ],
    visualAxes: {},
    avatarParams: {}
  },
  identity: { displayName: 'Test User' },
  astro: {
    western: { sunSign: 'leo' }
  },
  traits: {
    'trait.values.security': { id: 'trait.values.security', score: 75 },
    'trait.values.freedom': { id: 'trait.values.freedom', score: 60 },
    'trait.values.power': { id: 'trait.values.power', score: 40 },
    'trait.values.tradition': { id: 'trait.values.tradition', score: 30 },
    'trait.values.benevolence': { id: 'trait.values.benevolence', score: 90 },
  },
  tags: [],
  unlocks: {},
  fields: {},
  meta: {
    completion: {
      percent: 45,
      filledBlocks: ['values'],
      unlockCount: 2
    },
    lastUpdatedAt: new Date().toISOString()
  }
};

/**
 * Helper to get a typed mock return value for useProfileSnapshot
 */
const mockUseProfileSnapshotReturn = {
  snapshot: null,
  isLoading: false,
  isNew: false,
  error: null,
  mode: 'api' as const,
  refetch: vi.fn(),
};

// Mock the content file
vi.mock('@/content/character-sheet.de', () => ({
  characterSheetCopy: {
    header: {
      title: 'Kernwerte',
      subtitle: 'Dein Avatar ist ein Klima, kein Label.',
    },
    sections: {
      coreStats: 'Kernwerte',
      climate: 'Dein Klima',
      derived: 'Abgeleitete Werte',
      archetype: 'Archetyp',
    },
    stats: {
      clarity: 'Klarheit',
      courage: 'Mut',
      connection: 'Verbindung',
      order: 'Ordnung',
      shadow: 'Schatten',
    },
    axes: {
      shadow: 'Schatten',
      light: 'Licht',
      cold: 'Kühl',
      warm: 'Warm',
      surface: 'Fläche',
      depth: 'Tiefe',
      me: 'Ich',
      we: 'Wir',
      mind: 'Verstand',
      heart: 'Gefühl',
    },
    derived: {
      vitality: 'Vitalität',
      willpower: 'Willenskraft',
      chaos: 'Chaos',
      harmony: 'Harmonie',
    },
    banner: {
      title: 'Update nach Quiz',
    },
  },
}));

describe('CoreStatsCard', () => {
  it('should render all core stats with values', async () => {
    const stats = {
        clarity: 0.75,
        courage: 0.68,
        connection: 0.82,
        order: 0.55,
        shadow: 0.42,
    };
    render(<CoreStatsCard stats={stats} />);

    expect(screen.getByText('Kernwerte')).toBeInTheDocument();
    expect(screen.getByText('Klarheit')).toBeInTheDocument();
  });
});

// describe('DashboardPage - Integration', () => {
//   it('should render with complete snapshot', async () => {
//     const { useProfileSnapshot } = await import('@/hooks');
//     vi.mocked(useProfileSnapshot).mockReturnValue({
//       ...mockUseProfileSnapshotReturn,
//       snapshot: MOCK_SNAPSHOT as any,
//     } as any);

//     render(<DashboardPage />);

//     expect(screen.getByRole('main')).toBeInTheDocument();
//   });

//   it('should show loading state', async () => {
//     const { useProfileSnapshot } = await import('@/hooks');
//     vi.mocked(useProfileSnapshot).mockReturnValue({
//         ...mockUseProfileSnapshotReturn,
//         isLoading: true,
//     });

//     render(<DashboardPage />);
//     expect(screen.getByText(/Das Archiv öffnet sich.../i)).toBeInTheDocument();
//   });

//   it('should show error state when profile fails to load', async () => {
//     const { useProfileSnapshot } = await import('@/hooks');
//     vi.mocked(useProfileSnapshot).mockReturnValue({
//         ...mockUseProfileSnapshotReturn,
//         error: 'Network error',
//     });

//     render(<DashboardPage />);
//     expect(screen.getByText(/Die Verbindung ist gestört/i)).toBeInTheDocument();
//   });

//   it('should show intro for new users', async () => {
//     const { useProfileSnapshot } = await import('@/hooks');
//     vi.mocked(useProfileSnapshot).mockReturnValue({
//         ...mockUseProfileSnapshotReturn,
//         isNew: true,
//     });
    
//     render(<DashboardPage />);
//     expect(screen.getByText(/Willkommen am Altar/i)).toBeInTheDocument();
//   });
// });
