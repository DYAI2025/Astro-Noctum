import { describe, it, expect, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { AGENTS } from '@/packages/shared/src/agents/config';
import { AgentSection } from '../components/dashboard/AgentSection';
import { AgentProvider, useAgent } from '../contexts/AgentContext';

// ── Mocks (for tests 1 & 3 that render AgentSection directly) ───────────────

vi.mock('@/src/contexts/LanguageContext', () => ({
  useLanguage: () => ({ t: (k: string) => k, lang: 'de', setLang: vi.fn() }),
}));

vi.stubEnv('VITE_ELEVENLABS_AGENT_ID', 'test-levi-agent-id');

// ── Tests ────────────────────────────────────────────────────────────────────

describe('Agent Levi regression', () => {
  it('Levi tile renders with correct name and description', () => {
    const levi = AGENTS[0];

    render(
      <AgentProvider>
        <AgentSection
          agent={levi}
          isPremium={true}
          userId="user-123"
          onStopAudio={vi.fn()}
          onResumeAudio={vi.fn()}
          sunSign="Aries"
          zodiacAnimal="Dragon"
          dominantEl="Fire"
        />
      </AgentProvider>,
    );

    // "Levi Bazi" appears in badge and call button
    expect(screen.getAllByText(/Levi Bazi/).length).toBeGreaterThanOrEqual(1);
    // German description from config
    expect(screen.getByText(/ruhiger Mentor/)).toBeDefined();
  });

  it('Levi start/stop cycle works via AgentProvider', () => {
    let hookResult: ReturnType<typeof useAgent> | null = null;

    function TestHarness() {
      hookResult = useAgent();
      return null;
    }

    render(
      <AgentProvider>
        <TestHarness />
      </AgentProvider>,
    );

    // Initially inactive
    expect(hookResult!.agentStates.levi.active).toBe(false);
    expect(hookResult!.activeAgent).toBeNull();

    // Start Levi
    act(() => {
      hookResult!.startAgent('levi');
    });
    expect(hookResult!.agentStates.levi.active).toBe(true);
    expect(hookResult!.activeAgent).toBe('levi');

    // Stop Levi
    act(() => {
      hookResult!.stopAgent('levi');
    });
    expect(hookResult!.agentStates.levi.active).toBe(false);
    expect(hookResult!.activeAgent).toBeNull();
  });

  it('Levi config has correct envKey', () => {
    expect(AGENTS[0].envKey).toBe('VITE_ELEVENLABS_AGENT_ID');
  });
});
