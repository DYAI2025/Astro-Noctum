import { describe, it, expect } from 'vitest';
import {
  AGENTS,
  getAgent,
  isValidAgentType,
} from '@/packages/shared/src/agents/config';

describe('Agent persistence — shared config validation', () => {
  it('isValidAgentType accepts levi and eve', () => {
    expect(isValidAgentType('levi')).toBe(true);
    expect(isValidAgentType('eve')).toBe(true);
  });

  it('isValidAgentType rejects unknown values', () => {
    expect(isValidAgentType('unknown')).toBe(false);
    expect(isValidAgentType('')).toBe(false);
    // @ts-expect-error — testing runtime behavior with non-string
    expect(isValidAgentType(null)).toBe(false);
  });

  it('getAgent returns correct config for levi', () => {
    const levi = getAgent('levi');
    expect(levi.id).toBe('levi');
    expect(levi.name).toBe('Levi Bazi');
    expect(levi.persona).toBe('mentor');
    expect(levi.envKey).toBe('VITE_ELEVENLABS_AGENT_ID');
  });

  it('getAgent returns correct config for eve', () => {
    const eve = getAgent('eve');
    expect(eve.id).toBe('eve');
    expect(eve.name).toBe('Eve');
    expect(eve.persona).toBe('provocateur');
    expect(eve.envKey).toBe('VITE_ELEVENLABS_EVE_AGENT_ID');
  });

  it('getAgent throws for unknown agent', () => {
    // @ts-expect-error — intentional invalid id for runtime test
    expect(() => getAgent('unknown')).toThrow('Unknown agent: unknown');
  });

  it('AGENTS array includes levi and eve', () => {
    const agentIds = AGENTS.map((agent) => agent.id);
    expect(agentIds).toEqual(expect.arrayContaining(['levi', 'eve']));
  });
});
