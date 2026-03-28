export type AgentId = 'levi' | 'eve';

export interface AgentConfig {
  id: AgentId;
  name: string;
  envKey: string;
  persona: 'mentor' | 'provocateur';
  statusColor: { active: string; idle: string };
  accentColor: string;
  icon: string;
  description: { de: string; en: string };
}

export const AGENTS: AgentConfig[] = [
  {
    id: 'levi',
    name: 'Levi Bazi',
    envKey: 'VITE_ELEVENLABS_AGENT_ID',
    persona: 'mentor',
    statusColor: { active: 'rgb(52,211,153)', idle: 'rgb(139,105,20)' },
    accentColor: '#8B6914',
    icon: 'levi-symbol.svg',
    description: {
      de: 'Dein ruhiger Mentor. Levi führt dich mit Tiefe und Gelassenheit durch dein Chart.',
      en: 'Your calm mentor. Levi guides you through your chart with depth and composure.'
    }
  },
  {
    id: 'eve',
    name: 'Eve',
    envKey: 'VITE_ELEVENLABS_EVE_AGENT_ID',
    persona: 'provocateur',
    statusColor: { active: 'rgb(236,72,153)', idle: 'rgb(156,63,122)' },
    accentColor: '#9C3F7A',
    icon: 'eve-symbol.svg',
    description: {
      de: 'Direkt. Frech. Auf den Punkt. Eve sagt dir, was Sache ist — ohne Umwege.',
      en: 'Direct. Bold. To the point. Eve tells it like it is — no detours.'
    }
  }
];

export function getAgent(id: AgentId): AgentConfig {
  const agent = AGENTS.find(a => a.id === id);
  if (!agent) throw new Error(`Unknown agent: ${id}`);
  return agent;
}

export function isValidAgentType(value: string): value is AgentId {
  return value === 'levi' || value === 'eve';
}
