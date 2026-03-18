import { describe, it, expect } from 'vitest';

describe('useCompletedModules logic', () => {
  it('builds a Set from an array of module_id rows', () => {
    const rows = [
      { module_id: 'quiz.aura_colors.v1' },
      { module_id: 'quiz.krafttier.v1' },
    ];
    const set = new Set(rows.map(r => r.module_id));
    expect(set.has('quiz.aura_colors.v1')).toBe(true);
    expect(set.has('quiz.krafttier.v1')).toBe(true);
    expect(set.has('quiz.eq.v1')).toBe(false);
    expect(set.size).toBe(2);
  });

  it('addModule creates a new Set with the added module', () => {
    const prev = new Set(['quiz.aura_colors.v1']);
    const next = new Set([...prev, 'quiz.eq.v1']);
    expect(next.size).toBe(2);
    expect(next.has('quiz.eq.v1')).toBe(true);
    expect(prev.size).toBe(1);
  });
});
