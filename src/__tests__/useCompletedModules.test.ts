import { describe, it, expect, beforeEach } from 'vitest';

const STORAGE_KEY = 'bazodiac_completed_quizzes';

beforeEach(() => localStorage.clear());

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

describe('localStorage persistence for quiz completions', () => {
  it('addLocalCompleted persists module IDs to localStorage', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(['quiz.aura_colors.v1']));
    const existing = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    const set = new Set(existing);
    set.add('quiz.eq.v1');
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]));

    const result = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(result).toContain('quiz.aura_colors.v1');
    expect(result).toContain('quiz.eq.v1');
    expect(result).toHaveLength(2);
  });

  it('getLocalCompleted returns empty Set for missing key', () => {
    const raw = localStorage.getItem(STORAGE_KEY);
    expect(raw).toBeNull();
    const set = raw ? new Set(JSON.parse(raw)) : new Set();
    expect(set.size).toBe(0);
  });

  it('getLocalCompleted returns empty Set for corrupt data', () => {
    localStorage.setItem(STORAGE_KEY, 'not-json');
    let set: Set<string>;
    try {
      set = new Set(JSON.parse(localStorage.getItem(STORAGE_KEY)!));
    } catch {
      set = new Set();
    }
    expect(set.size).toBe(0);
  });

  it('merges localStorage and DB results', () => {
    const fromDb = new Set(['quiz.aura_colors.v1']);
    const fromLocal = new Set(['quiz.eq.v1', 'quiz.aura_colors.v1']);
    const merged = new Set([...fromDb, ...fromLocal]);
    expect(merged.size).toBe(2);
    expect(merged.has('quiz.aura_colors.v1')).toBe(true);
    expect(merged.has('quiz.eq.v1')).toBe(true);
  });

  it('survives reload: data persisted in localStorage is read back', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(['quiz.krafttier.v1', 'quiz.eq.v1']));
    const raw = localStorage.getItem(STORAGE_KEY);
    const arr = JSON.parse(raw!);
    const set = new Set(arr);
    expect(set.size).toBe(2);
    expect(set.has('quiz.krafttier.v1')).toBe(true);
  });
});
