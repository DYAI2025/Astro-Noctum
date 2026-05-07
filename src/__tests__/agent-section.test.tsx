import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AgentSection } from '../components/dashboard/AgentSection';
import { AGENTS } from '@/packages/shared/src/agents/config';

// ── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('@/src/contexts/AgentContext', () => ({
  useAgent: () => ({
    agentStates: {
      levi: { active: false, upgrading: false },
      eve: { active: false, upgrading: false },
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

// Provide a controlled import.meta.env — Levi is configured, Eve is not by default
const envOverrides: Record<string, string | undefined> = {
  VITE_ELEVENLABS_AGENT_ID: 'test-levi-agent-id',
  VITE_ELEVENLABS_EVE_AGENT_ID: 'test-eve-agent-id',
};

vi.stubEnv('VITE_ELEVENLABS_AGENT_ID', 'test-levi-agent-id');
vi.stubEnv('VITE_ELEVENLABS_EVE_AGENT_ID', 'test-eve-agent-id');

// ── Shared props ─────────────────────────────────────────────────────────────

const baseProps = {
  isPremium: true,
  userId: 'user-123',
  onStopAudio: vi.fn(),
  onResumeAudio: vi.fn(),
  sunSign: 'Aries',
  zodiacAnimal: 'Dragon',
  dominantEl: 'Fire',
};

// ── Tests ────────────────────────────────────────────────────────────────────

describe('AgentSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders two agent tiles when mapped over AGENTS', () => {
    const { container } = render(
      <>
        {AGENTS.map((a) => (
          <AgentSection key={a.id} agent={a} {...baseProps} />
        ))}
      </>,
    );

    // Both agent names appear (badge + description may both contain name)
    expect(screen.getAllByText(/Levi Bazi/).length).toBeGreaterThanOrEqual(1);
    // Eve appears in badge text "Eve — Bereit"
    expect(screen.getAllByText(/Eve/).length).toBeGreaterThanOrEqual(1);
  });

  it('premium user sees call button', () => {
    render(<AgentSection agent={AGENTS[0]} {...baseProps} isPremium={true} />);

    // The call button text uses the translation key fallback pattern
    // which yields "Levi Bazi anrufen" as hardcoded fallback
    const callButton = screen.getByRole('button');
    expect(callButton).toBeDefined();
    expect(callButton.textContent).toContain('anrufen');
  });

  it('non-premium user sees lock-only treatment, no button', () => {
    render(<AgentSection agent={AGENTS[0]} {...baseProps} isPremium={false} />);

    // Free users now see a non-interactive lock indicator (lock icon + "Premium-Inhalt")
    // The dashboard's bottom upgrade card is the single prime CTA.
    const lock = screen.getByTestId('agent-card-locked');
    expect(lock).toBeDefined();
    expect(lock.textContent).toContain('dashboard.premium.lockLabel');

    // No button rendered for the free-user branch
    const buttons = screen.queryAllByRole('button');
    expect(buttons).toHaveLength(0);
  });

  it('shows Coming Soon when env var missing', () => {
    vi.stubEnv('VITE_ELEVENLABS_EVE_AGENT_ID', '');

    render(<AgentSection agent={AGENTS[1]} {...baseProps} />);

    expect(screen.getByText('Coming Soon')).toBeDefined();

    // Restore for other tests
    vi.stubEnv('VITE_ELEVENLABS_EVE_AGENT_ID', 'test-eve-agent-id');
  });
});
