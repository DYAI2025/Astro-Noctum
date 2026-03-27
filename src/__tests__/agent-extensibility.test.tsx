import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AgentSection } from '../components/dashboard/AgentSection';
import type { AgentConfig } from '@/packages/shared/src/agents/config';

// ── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('@/src/contexts/AgentContext', () => ({
  useAgent: () => ({
    agentStates: {
      levi: { active: false, upgrading: false },
      eve: { active: false, upgrading: false },
      orion: { active: false, upgrading: false },
    },
    activeAgent: null,
    startAgent: vi.fn(),
    stopAgent: vi.fn(),
    setUpgrading: vi.fn(),
  }),
}));

vi.mock('@/src/contexts/LanguageContext', () => ({
  useLanguage: () => ({ t: (k: string) => k, lang: 'de', setLang: vi.fn() }),
}));

vi.stubEnv('VITE_ELEVENLABS_ORION_AGENT_ID', 'test-orion-id');

// ── Tests ────────────────────────────────────────────────────────────────────

describe('Agent extensibility', () => {
  it('third agent config renders without code changes', () => {
    const thirdAgent: AgentConfig = {
      id: 'orion' as any,
      name: 'Orion',
      envKey: 'VITE_ELEVENLABS_ORION_AGENT_ID',
      persona: 'mentor',
      statusColor: { active: 'rgb(100,200,255)', idle: 'rgb(50,100,150)' },
      accentColor: '#3266AA',
      icon: 'orion-symbol.svg',
      description: {
        de: 'Der Navigator. Orion zeigt dir den Weg durch die Sterne.',
        en: 'The navigator. Orion shows you the way through the stars.',
      },
    };

    render(
      <AgentSection
        agent={thirdAgent}
        isPremium={true}
        userId="user-123"
        onStopAudio={vi.fn()}
        onResumeAudio={vi.fn()}
        sunSign="Leo"
        zodiacAnimal="Tiger"
        dominantEl="Wood"
      />,
    );

    // Agent name should appear in the badge text (fallback pattern: "Orion — Bereit")
    expect(screen.getAllByText(/Orion/).length).toBeGreaterThanOrEqual(1);
    // Description should render
    expect(screen.getByText(/Navigator/)).toBeDefined();
  });
});
