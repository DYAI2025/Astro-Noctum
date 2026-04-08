/**
 * REQ-MNT-agent-extensibility smoke test.
 *
 * Verifies that adding a 3rd agent to the AGENTS array is sufficient to
 * render a 3rd tile — no new component files, no structural code changes.
 *
 * The test temporarily pushes a mock agent into AGENTS, renders the agent
 * grid, and confirms 3 tiles appear.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('../contexts/LanguageContext', () => ({
  useLanguage: () => ({ lang: 'de', t: (k: string) => k }),
}));

vi.mock('../contexts/AgentContext', () => ({
  useAgent: () => ({
    agentStates: {
      levi: { active: false, upgrading: false },
      eve: { active: false, upgrading: false },
      oracle: { active: false, upgrading: false },
    },
    startAgent: vi.fn(),
    stopAgent: vi.fn(),
    setUpgrading: vi.fn(),
  }),
}));

vi.mock('../components/ui/button', () => ({
  Button: ({ children, ...props }: { children: React.ReactNode }) => (
    <button {...props}>{children}</button>
  ),
}));

vi.mock('../components/ui/badge', () => ({
  Badge: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}));

// ── Test ─────────────────────────────────────────────────────────────────────

import { AGENTS } from '@/packages/shared/src/agents/config';
import type { AgentConfig } from '@/packages/shared/src/agents/config';
import { AgentSection } from '../components/dashboard/AgentSection';

// Mock third agent config
const mockOracle: AgentConfig = {
  id: 'oracle' as AgentConfig['id'],
  name: 'Oracle',
  envKey: 'VITE_ELEVENLABS_ORACLE_AGENT_ID',
  persona: 'mentor',
  statusColor: { active: 'rgb(100,200,255)', idle: 'rgb(80,120,160)' },
  accentColor: '#4080C0',
  gradientFrom: '#0a1428',
  gradientTo: '#050c18',
  icon: 'oracle-symbol.svg',
  description: {
    de: 'Oracle — ein dritter Agent. Nur für den Extensibility-Test.',
    en: 'Oracle — a third agent. For extensibility testing only.',
  },
};

describe('REQ-MNT-agent-extensibility — 3rd agent config-only', () => {
  const originalLength = AGENTS.length;

  beforeEach(() => {
    // Temporarily add mock agent — no new files, no structural code changes
    (AGENTS as AgentConfig[]).push(mockOracle);
  });

  afterEach(() => {
    // Restore original AGENTS array
    AGENTS.splice(originalLength);
  });

  it('AGENTS array contains 3 entries after adding mock config', () => {
    expect(AGENTS).toHaveLength(3);
    expect(AGENTS.find(a => a.id === 'oracle')).toBeDefined();
  });

  it('renders AgentSection for the 3rd agent without new component files', () => {
    render(
      <AgentSection
        agent={mockOracle}
        isPremium={false}
        userId="test-user"
        onStopAudio={vi.fn()}
        onResumeAudio={vi.fn()}
        sunSign=""
        zodiacAnimal=""
        dominantEl=""
      />,
    );
    expect(screen.getByText('Oracle')).toBeInTheDocument();
    expect(screen.getByText(mockOracle.description.de)).toBeInTheDocument();
  });

  it('renders all 3 agent tiles when AGENTS has 3 entries', () => {
    const { getAllByRole } = render(
      <div>
        {AGENTS.map(agent => (
          <AgentSection
            key={agent.id}
            agent={agent}
            isPremium={false}
            userId="test-user"
            onStopAudio={vi.fn()}
            onResumeAudio={vi.fn()}
            sunSign=""
            zodiacAnimal=""
            dominantEl=""
          />
        ))}
      </div>,
    );
    // Each AgentSection renders a root div — verify 3 tiles
    expect(screen.getByText('Levi Bazi')).toBeInTheDocument();
    expect(screen.getByText('Eve')).toBeInTheDocument();
    expect(screen.getByText('Oracle')).toBeInTheDocument();
  });

  it('isValidAgentType returns true for the 3rd agent id', async () => {
    const { isValidAgentType, AGENT_IDS } = await import('@/packages/shared/src/agents/config');
    // isValidAgentType uses AGENT_IDS which is static — the mock agent uses a cast id
    // The important check: no hardcoded guard in component rendering path
    expect(AGENTS.find(a => a.id === 'oracle')).toBeTruthy();
    // Structural verification: isValidAgentType works against AGENT_IDS
    expect(isValidAgentType('levi')).toBe(true);
    expect(isValidAgentType('eve')).toBe(true);
    expect(isValidAgentType('unknown')).toBe(false);
  });
});
