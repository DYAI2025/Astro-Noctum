import type { Aphorism, CouncilFigure, DayMode, WuxingVector } from './types';

export function cosineSimilarity(a: WuxingVector, b: WuxingVector): number {
  const av = [a.wood, a.fire, a.earth, a.metal, a.water];
  const bv = [b.wood, b.fire, b.earth, b.metal, b.water];
  const dot = av.reduce((sum, x, i) => sum + x * bv[i], 0);
  const an = Math.sqrt(av.reduce((sum, x) => sum + x * x, 0));
  const bn = Math.sqrt(bv.reduce((sum, x) => sum + x * x, 0));
  if (an === 0 || bn === 0) return 0;
  return dot / (an * bn);
}

export function dayModeFromHarmony(h: number): { mode: DayMode; intensity: number } {
  const mode: DayMode = h < 0.45 ? 'spannung' : h < 0.5 ? 'pulse' : 'trace';
  const intensity = Math.max(0, Math.min(1, Math.abs(h - 0.45) / 0.55));
  return { mode, intensity };
}

export function validateCouncil(figures: CouncilFigure[]): void {
  const expected = ['sonne', 'mond', 'aszendent', 'day_master', 'jahrestier', 'wuxing_dom'];
  const actual = figures.map((f) => f.key).sort();
  if (actual.join(',') !== [...expected].sort().join(',')) {
    throw new Error('Rat der sechs unvollstaendig oder inkonsistent');
  }
}

export function selectAphorism(pool: Aphorism[], userId: string, date: string, mode: DayMode): Aphorism {
  const eligible = pool.filter((a) => a.status === 'approved' && a.mode_tags.includes(mode));
  if (eligible.length === 0) throw new Error(`No approved aphorism for mode ${mode}`);
  const top = [...eligible].sort((a, b) => b.quality_rating - a.quality_rating || a.id.localeCompare(b.id)).slice(0, 5);
  const seed = simpleHash(`${userId}:${date}:${mode}`);
  return top[seed % top.length];
}

function simpleHash(value: string): number {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h >>> 0);
}
