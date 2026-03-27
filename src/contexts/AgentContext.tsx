import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { AGENTS, type AgentId } from '@/packages/shared/src/agents/config';

// --- Types ---

interface AgentState {
  active: boolean;
  upgrading: boolean;
}

interface AgentContextValue {
  agentStates: Record<AgentId, AgentState>;
  activeAgent: AgentId | null;
  startAgent: (id: AgentId) => void;
  stopAgent: (id: AgentId) => void;
  setUpgrading: (id: AgentId, value: boolean) => void;
}

// --- Initial state ---

const initialAgentStates = Object.fromEntries(
  AGENTS.map((a) => [a.id, { active: false, upgrading: false }]),
) as Record<AgentId, AgentState>;

// --- Context ---

const AgentContext = createContext<AgentContextValue | null>(null);

// --- Provider ---

export function AgentProvider({ children }: { children: ReactNode }) {
  const [agentStates, setAgentStates] =
    useState<Record<AgentId, AgentState>>(initialAgentStates);
  const [activeAgent, setActiveAgent] = useState<AgentId | null>(null);

  const startAgent = useCallback((id: AgentId) => {
    setAgentStates((prev) => {
      const next = { ...prev };
      for (const key of Object.keys(next) as AgentId[]) {
        next[key] = { ...next[key], active: key === id };
      }
      return next;
    });
    setActiveAgent(id);
  }, []);

  const stopAgent = useCallback((id: AgentId) => {
    setAgentStates((prev) => ({
      ...prev,
      [id]: { ...prev[id], active: false },
    }));
    setActiveAgent(null);
  }, []);

  const setUpgrading = useCallback((id: AgentId, value: boolean) => {
    setAgentStates((prev) => ({
      ...prev,
      [id]: { ...prev[id], upgrading: value },
    }));
  }, []);

  const value = useMemo<AgentContextValue>(
    () => ({ agentStates, activeAgent, startAgent, stopAgent, setUpgrading }),
    [agentStates, activeAgent, startAgent, stopAgent, setUpgrading],
  );

  return (
    <AgentContext.Provider value={value}>{children}</AgentContext.Provider>
  );
}

// --- Hook ---

export function useAgent(): AgentContextValue {
  const ctx = useContext(AgentContext);
  if (!ctx) {
    throw new Error('useAgent must be used within an AgentProvider');
  }
  return ctx;
}
