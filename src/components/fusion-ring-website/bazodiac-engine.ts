/**
 * Bazodiac Signature Engine — Spirograph-basiertes Partikel-System
 *
 * Jeder User bekommt eine einzigartige, lebendige geometrische Signatur
 * basierend auf 7 Planetenfrequenzen (Hans Cousto Cosmic Octave).
 *
 * 28.000 Partikel, 4-Tier Detail-System, Emergence/Mustersprung,
 * Kaleidoskop-Faltung, Zodiak-Ring, Transit-Overlay.
 */

// ═══════════════════════════════════════
//  1. MATH UTILITIES
// ═══════════════════════════════════════

export function clamp(v: number, a: number, b: number): number {
  return Math.max(a, Math.min(b, v));
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function frac(x: number): number {
  return x - Math.floor(x);
}

/** Deterministic pseudo-random [0,1] — no Math.random */
export function hash01(seed: number, k: number): number {
  return frac(Math.sin(seed * 12.9898 + k * 78.233) * 43758.5453123);
}

/** Log-normalize Hz [1, 20000] → [0, 1] */
export function logNormHz(freq: number): number {
  const lo = Math.log(1);
  const hi = Math.log(20000);
  return clamp((Math.log(Math.abs(freq) + 0.001) - lo) / (hi - lo), 0, 1);
}

export function gcd(a: number, b: number): number {
  a = Math.abs(Math.round(a));
  b = Math.abs(Math.round(b));
  while (b) { const t = b; b = a % b; a = t; }
  return a || 1;
}

export function lcm(a: number, b: number): number {
  return Math.abs(Math.round(a) * Math.round(b)) / gcd(a, b);
}

// ═══════════════════════════════════════
//  2. PLANET DATA
// ═══════════════════════════════════════

export interface PlanetDef {
  id: string;
  hz: number;
  color: [number, number, number]; // RGB 0-1
  hexColor: string;
  zodiacDeg: number;
  sign: string;
}

export const PLANETS: PlanetDef[] = [
  { id: 'Sun',     hz: 126.22, color: [1.0,  0.69, 0.19], hexColor: '#FFB030', zodiacDeg: 120, sign: 'Leo' },
  { id: 'Moon',    hz: 210.42, color: [0.72, 0.63, 0.94], hexColor: '#B8A0F0', zodiacDeg: 90,  sign: 'Cancer' },
  { id: 'Mercury', hz: 141.27, color: [0.31, 0.91, 0.94], hexColor: '#50E8F0', zodiacDeg: 60,  sign: 'Gemini' },
  { id: 'Venus',   hz: 221.23, color: [1.0,  0.50, 0.75], hexColor: '#FF80C0', zodiacDeg: 30,  sign: 'Taurus' },
  { id: 'Mars',    hz: 144.72, color: [1.0,  0.20, 0.20], hexColor: '#FF3333', zodiacDeg: 0,   sign: 'Aries' },
  { id: 'Jupiter', hz: 183.58, color: [1.0,  0.84, 0.0],  hexColor: '#FFD700', zodiacDeg: 240, sign: 'Sagittarius' },
  { id: 'Saturn',  hz: 147.85, color: [0.44, 0.56, 0.69], hexColor: '#7090B0', zodiacDeg: 270, sign: 'Capricorn' },
];

export const PLANET_MAP = new Map(PLANETS.map(p => [p.id, p]));

// ═══════════════════════════════════════
//  3. QUIZ MODULATION
// ═══════════════════════════════════════

export type QuizDimension = 'empathy' | 'logic' | 'creativity' | 'discipline' | 'intuition' | 'assertion';

/** Quiz → Planet Mapping Matrix [dimension][planetIndex] */
const QUIZ_MATRIX: Record<QuizDimension, number[]> = {
  //                Sun    Moon   Merc   Venus  Mars   Jup    Saturn
  empathy:    [  0.05,  0.40,  0.05,  0.25, -0.15,  0.35, -0.10 ],
  logic:      [  0.05, -0.15,  0.45, -0.05,  0.05,  0.10,  0.30 ],
  creativity: [  0.10,  0.25,  0.20,  0.40, -0.05,  0.15, -0.20 ],
  discipline: [  0.10, -0.10,  0.05, -0.10,  0.30, -0.05,  0.45 ],
  intuition:  [  0.05,  0.45, -0.10,  0.15, -0.10,  0.30, -0.15 ],
  assertion:  [  0.35, -0.15,  0.05, -0.15,  0.45,  0.10,  0.10 ],
};

export const QUIZ_DIMS: QuizDimension[] = ['empathy', 'logic', 'creativity', 'discipline', 'intuition', 'assertion'];

// ═══════════════════════════════════════
//  4. WEIGHT COMPUTATION
// ═══════════════════════════════════════

export interface BazodiacWeights {
  /** Final normalized weights per planet [0.08 .. 1.0] */
  weights: Map<string, number>;
  /** Sorted strongest → weakest */
  ranked: { id: string; weight: number }[];
  /** The strongest planet */
  dominant: PlanetDef;
}

export function computeWeights(
  natal: Map<string, number>,
  quiz: Map<QuizDimension, number>
): BazodiacWeights {
  // Raw weights
  const raw = new Map<string, number>();
  let maxRaw = 0;

  PLANETS.forEach((p, pi) => {
    const nw = natal.get(p.id) ?? 0.5;
    let boost = 0;
    QUIZ_DIMS.forEach(dim => {
      const score = quiz.get(dim) ?? 0.5;
      const centered = (score - 0.5) * 2; // [-1, 1]
      boost += centered * (QUIZ_MATRIX[dim]?.[pi] ?? 0);
    });
    const rw = nw * (1 + boost);
    raw.set(p.id, Math.max(0.001, rw));
    if (rw > maxRaw) maxRaw = rw;
  });

  // Relative normalization (strongest = 1.0)
  const weights = new Map<string, number>();
  raw.forEach((rw, id) => {
    const prop = rw / (maxRaw || 1);
    const final = clamp(prop * 0.85 + prop * prop * 0.15, 0.08, 1.0);
    weights.set(id, final);
  });

  // Ranked
  const ranked = Array.from(weights.entries())
    .map(([id, weight]) => ({ id, weight }))
    .sort((a, b) => b.weight - a.weight);

  const dominant = PLANET_MAP.get(ranked[0]!.id) ?? PLANETS[0]!;

  return { weights, ranked, dominant };
}

// ═══════════════════════════════════════
//  5. SPIROGRAPH PARAMETERS FROM HZ
// ═══════════════════════════════════════

export type SpiroKind = 'hypotrochoid' | 'epitrochoid';

export interface SpiroParams {
  kind: SpiroKind;
  R: number;       // outer radius (normalized = 1.0)
  r: number;       // inner/outer wheel
  d: number;       // pen distance
  n: number;       // symmetry order (petals)
  turns: number;   // full turns for curve
  harmLock: boolean;
}

export function computeSpiroParams(hz: number, harmLock = true): SpiroParams {
  const t = logNormHz(hz);
  // Keep n in [3, 9] for clearly visible lobes — not too many petals
  const n = 3 + Math.floor(lerp(0, 6, t));
  const seed = Math.abs(hz) + 0.12345;

  const kind: SpiroKind = hash01(seed, 1) < 0.5 ? 'hypotrochoid' : 'epitrochoid';
  const R = 1.0;
  // Larger r ratio for bigger, more visible lobes
  const rBase = R / n;
  const r = harmLock ? rBase : rBase * (1 + (hash01(seed, 2) - 0.5) * 0.3);
  // More dramatic pen distance for pronounced curves
  const d = lerp(0.4, 1.2, hash01(seed, 3));
  const turns = harmLock ? Math.max(n, lcm(n, 3)) : 10 + Math.floor(t * 14);

  return { kind, R, r, d, n, turns, harmLock };
}

/** Compute a single point on the spirograph curve */
export function spiroPoint(
  kind: SpiroKind,
  R: number,
  r: number,
  d: number,
  t: number
): { x: number; y: number } {
  if (kind === 'hypotrochoid') {
    const k = (R - r) / r;
    return {
      x: (R - r) * Math.cos(t) + d * Math.cos(k * t),
      y: (R - r) * Math.sin(t) - d * Math.sin(k * t),
    };
  } else {
    const k = (R + r) / r;
    return {
      x: (R + r) * Math.cos(t) - d * Math.cos(k * t),
      y: (R + r) * Math.sin(t) - d * Math.sin(k * t),
    };
  }
}

// ═══════════════════════════════════════
//  6. TIER SYSTEM
// ═══════════════════════════════════════

export type Tier = 0 | 1 | 2 | 3;

export function getTier(weight: number): Tier {
  if (weight < 0.20) return 0;
  if (weight < 0.50) return 1;
  if (weight < 0.75) return 2;
  return 3;
}

export function fractalDepth(weight: number): number {
  if (weight < 0.75) return 0;
  return Math.min(1, (weight - 0.75) / 0.25);
}

// ═══════════════════════════════════════
//  7. PARTICLE GENERATION
// ═══════════════════════════════════════

export type ParticleLayer = 'glow' | 'curve' | 'fractal' | 'subfractal' | 'bridge' | 'centerjump' | 'zodiac' | 'transit';

export interface BazParticle {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  planetId: string;
  layer: ParticleLayer;
  r: number;          // visual radius px
  color: [number, number, number];
  alpha: number;
  vx: number;
  vy: number;
  phase: number;
  lifetime: number;   // -1 = permanent
  kFold: number;      // which fold (0 = original)
  kMirror: boolean;
}

/** Max radius in scene units for spirograph placement */
const MAX_R = 2.0;

/** Compute anchor points along the spirograph main curve */
export function computeAnchors(
  sp: SpiroParams,
  count: number,
  maxR: number
): { x: number; y: number }[] {
  const anchors: { x: number; y: number }[] = [];
  const totalT = 2 * Math.PI * sp.turns;
  for (let i = 0; i < count; i++) {
    const t = (i / count) * totalT;
    const pt = spiroPoint(sp.kind, sp.R, sp.r, sp.d, t);
    // Normalize so max extent maps to maxR
    anchors.push({ x: pt.x * maxR * 0.42, y: pt.y * maxR * 0.42 });
  }
  return anchors;
}

/** Generate particles for a single planet */
export function generatePlanetParticles(
  planet: PlanetDef,
  weight: number,
  maxR: number,
  budgetMultiplier: number = 1.0
): BazParticle[] {
  const tier = getTier(weight);
  const sp = computeSpiroParams(planet.hz);
  const particles: BazParticle[] = [];
  const col = planet.color;
  const seed = Math.abs(planet.hz) + 0.12345;

    // GLOW — Two-stage distribution (Core vs Cloud)
    const count = Math.floor(400 * budgetMultiplier);
    for (let i = 0; i < count; i++) {
      const isCore = hash01(seed, i + 100) < 0.35;
      const cloudR = isCore ? maxR * 0.35 : maxR * (0.6 + weight * 1.5);
      const a = hash01(seed, i * 3 + 101) * Math.PI * 2;
      const dist = hash01(seed, i * 3 + 102) * cloudR;
      const px = Math.cos(a) * dist;
      const py = Math.sin(a) * dist;
      particles.push({
        x: px, y: py, baseX: px, baseY: py,
        planetId: planet.id, layer: 'glow',
        r: isCore ? lerp(1.5, 3.0, hash01(seed, i + 103)) : lerp(3.0, 7.0, hash01(seed, i + 104)),
        color: col, alpha: isCore ? lerp(0.1, 0.35, weight) : lerp(0.04, 0.15, weight),
        vx: (hash01(seed, i + 200) - 0.5) * 0.002,
        vy: (hash01(seed, i + 300) - 0.5) * 0.002,
        phase: hash01(seed, i) * Math.PI * 2,
        lifetime: -1, kFold: 0, kMirror: false,
      });
    }

  // For tiers 1-3: spirograph curve particles
  const totalT = 2 * Math.PI * sp.turns;
  const turnsUsed = tier === 1
    ? sp.turns * lerp(0.15, 0.5, (weight - 0.2) / 0.3)
    : sp.turns;
  const usedT = 2 * Math.PI * turnsUsed;

  const baseCurveCount = tier === 1 ? 600 : 1200;
  const curveCount = Math.floor(baseCurveCount * budgetMultiplier);
  const jitter = tier === 1 ? 0.02 : 0.003;
  const pSize = tier === 1 ? lerp(3.0, 5.0, (weight - 0.2) / 0.3) : lerp(2.0, 4.0, (weight - 0.5) / 0.25);
  const pAlpha = tier === 1 ? lerp(0.35, 0.65, (weight - 0.2) / 0.3) : lerp(0.55, 0.85, (weight - 0.5) / 0.5);

  // Scale factor to normalize spirograph extent to maxR
  const scale = maxR * 0.42;

  for (let i = 0; i < curveCount; i++) {
    const t = (i / curveCount) * usedT;
    const pt = spiroPoint(sp.kind, sp.R, sp.r, sp.d, t);
    const jx = jitter > 0 ? (hash01(seed, i * 2 + 500) - 0.5) * jitter * maxR : 0;
    const jy = jitter > 0 ? (hash01(seed, i * 2 + 501) - 0.5) * jitter * maxR : 0;
    const px = pt.x * scale + jx;
    const py = pt.y * scale + jy;
    particles.push({
      x: px, y: py, baseX: px, baseY: py,
      planetId: planet.id, layer: 'curve',
      r: pSize, color: col, alpha: pAlpha,
      vx: 0, vy: 0,
      phase: hash01(seed, i + 600) * Math.PI * 2,
      lifetime: -1, kFold: 0, kMirror: false,
    });
  }

  // TIER 3 — Fractal sub-patterns
  if (tier === 3) {
    const fd = fractalDepth(weight);
    const mainCount = Math.round(sp.n * 6);
    const subScale = lerp(0.08, 0.18, fd);

    for (let ai = 0; ai < mainCount; ai++) {
      const anchorT = (ai / mainCount) * totalT;
      const apt = spiroPoint(sp.kind, sp.R, sp.r, sp.d, anchorT);
      const ax = apt.x * scale;
      const ay = apt.y * scale;

      // Mini-spirograph at each anchor
      const subCount = Math.floor(60 * budgetMultiplier);
      for (let si = 0; si < subCount; si++) {
        const st = (si / subCount) * 2 * Math.PI * Math.max(sp.turns * 0.3, 3);
        const spt = spiroPoint(sp.kind, sp.R, sp.r, sp.d, st);
        const sx = ax + spt.x * scale * subScale;
        const sy = ay + spt.y * scale * subScale;
        particles.push({
          x: sx, y: sy, baseX: sx, baseY: sy,
          planetId: planet.id, layer: 'fractal',
          r: lerp(1.0, 2.5, hash01(seed, ai * 200 + si)),
          color: col, alpha: lerp(0.3, 0.6, fd),
          vx: 0, vy: 0,
          phase: hash01(seed, ai * 200 + si + 700) * Math.PI * 2,
          lifetime: -1, kFold: 0, kMirror: false,
        });
      }

      // Sub-sub at high fractalDepth
      if (fd > 0.5) {
        const microScale = subScale * 0.35;
        const subAnchors = Math.max(2, Math.round(sp.n * 0.5));
        for (let sai = 0; sai < subAnchors; sai++) {
          const saT = (sai / subAnchors) * 2 * Math.PI * 3;
          const sapt = spiroPoint(sp.kind, sp.R, sp.r, sp.d, saT);
          const sax = ax + sapt.x * scale * subScale;
          const say = ay + sapt.y * scale * subScale;
          const microCount = Math.floor(lerp(15, 50, (fd - 0.5) / 0.5) * Math.max(0.3, budgetMultiplier));
          for (let mi = 0; mi < microCount; mi++) {
            const mt = (mi / microCount) * 2 * Math.PI * 2;
            const mpt = spiroPoint(sp.kind, sp.R, sp.r, sp.d, mt);
            const mx = sax + mpt.x * scale * microScale;
            const my = say + mpt.y * scale * microScale;
            particles.push({
              x: mx, y: my, baseX: mx, baseY: my,
              planetId: planet.id, layer: 'subfractal',
              r: lerp(0.3, 0.6, hash01(seed, ai * 1000 + sai * 100 + mi)),
              color: col, alpha: lerp(0.1, 0.35, (fd - 0.5) / 0.5),
              vx: 0, vy: 0,
              phase: hash01(seed, ai * 1000 + sai * 100 + mi + 800) * Math.PI * 2,
              lifetime: -1, kFold: 0, kMirror: false,
            });
          }
        }
      }
    }

    // Filigrane dots at fractal nodes
    const dotCount = Math.floor(lerp(50, 300, fd) * budgetMultiplier);
    for (let di = 0; di < dotCount; di++) {
      const dt = hash01(seed, di + 900) * totalT;
      const dpt = spiroPoint(sp.kind, sp.R, sp.r, sp.d, dt);
      particles.push({
        x: dpt.x * scale, y: dpt.y * scale,
        baseX: dpt.x * scale, baseY: dpt.y * scale,
        planetId: planet.id, layer: 'fractal',
        r: lerp(0.3, 0.8, hash01(seed, di + 950)),
        color: col, alpha: lerp(0.3, 0.7, fd),
        vx: 0, vy: 0,
        phase: hash01(seed, di + 960) * Math.PI * 2,
        lifetime: -1, kFold: 0, kMirror: false,
      });
    }
  }

  return particles;
}

// ═══════════════════════════════════════
//  8. EMERGENCE / MUSTERSPRUNG
// ═══════════════════════════════════════

export interface EmergenceResult {
  emergence: number;
  bridges: BazParticle[];
  subBridges: BazParticle[];
  centerJumps: BazParticle[];
  zodiacRoots: BazParticle[];
}

export function computeEmergence(
  weights: BazodiacWeights,
  maxR: number,
  budgetMultiplier: number = 1.0
): EmergenceResult {
  const fractalPlanets = weights.ranked.filter(r => r.weight >= 0.75);
  const bridges: BazParticle[] = [];
  const subBridges: BazParticle[] = [];
  const centerJumps: BazParticle[] = [];
  const zodiacRoots: BazParticle[] = [];

  if (fractalPlanets.length < 2) {
    // Still generate zodiac roots for all planets
    generateZodiacRoots(weights, maxR, zodiacRoots, budgetMultiplier);
    return { emergence: 0, bridges, subBridges, centerJumps, zodiacRoots };
  }

  const depths = fractalPlanets.map(p => fractalDepth(p.weight));
  const avgDepth = depths.reduce((s, d) => s + d, 0) / depths.length;
  const maxDepth = Math.max(...depths);
  const emergence = avgDepth * 0.6 + maxDepth * 0.4;

  // Compute anchors for each fractal planet
  const planetAnchors = new Map<string, { x: number; y: number }[]>();
  const bridgeCount = new Map<string, number>();
  
  fractalPlanets.forEach(fp => {
    const planet = PLANET_MAP.get(fp.id)!;
    const sp = computeSpiroParams(planet.hz);
    const mainCount = Math.round(sp.n * 6);
    const anchors = computeAnchors(sp, mainCount, maxR);
    planetAnchors.set(fp.id, anchors);
    bridgeCount.set(fp.id, 0);
  });

  // PHASE 2: Proximity Bridges
  const proximityThreshold = maxR * lerp(0.10, 0.45, emergence);
  const maxBridges = Math.floor(lerp(3, 40, emergence * emergence));
  let totalBridges = 0;

  for (let i = 0; i < fractalPlanets.length; i++) {
    for (let j = i + 1; j < fractalPlanets.length; j++) {
      const pA = fractalPlanets[i]!;
      const pB = fractalPlanets[j]!;
      const anchorsA = planetAnchors.get(pA.id) ?? [];
      const anchorsB = planetAnchors.get(pB.id) ?? [];
      const colA = PLANET_MAP.get(pA.id)!.color;
      const colB = PLANET_MAP.get(pB.id)!.color;
      const mixCol: [number, number, number] = [
        (colA[0] + colB[0]) * 0.5,
        (colA[1] + colB[1]) * 0.5,
        (colA[2] + colB[2]) * 0.5,
      ];

      for (const aA of anchorsA) {
        for (const aB of anchorsB) {
          if (totalBridges >= maxBridges) break;
          const dist = Math.hypot(aA.x - aB.x, aA.y - aB.y);
          if (dist < proximityThreshold && dist > 0.02) {
            const strength = 1 - dist / proximityThreshold;
            const alpha = lerp(0.05, 0.30, emergence) * strength;
            // Place particles along bridge
            const bCount = Math.round(lerp(5, 20, strength));
            for (let bi = 0; bi < bCount; bi++) {
              const t = bi / (bCount - 1 || 1);
              // Slight curve toward center
              const midX = (aA.x + aB.x) * 0.5 * 0.85;
              const midY = (aA.y + aB.y) * 0.5 * 0.85;
              const bx = lerp(lerp(aA.x, midX, t * 2), lerp(midX, aB.x, (t - 0.5) * 2), t > 0.5 ? 1 : 0);
              const by = lerp(lerp(aA.y, midY, t * 2), lerp(midY, aB.y, (t - 0.5) * 2), t > 0.5 ? 1 : 0);
              // Quadratic bezier
              const u = t;
              const px = (1 - u) * (1 - u) * aA.x + 2 * (1 - u) * u * midX + u * u * aB.x;
              const py = (1 - u) * (1 - u) * aA.y + 2 * (1 - u) * u * midY + u * u * aB.y;
              bridges.push({
                x: px, y: py, baseX: px, baseY: py,
                planetId: pA.id, layer: 'bridge',
                r: lerp(0.4, 1.0, strength),
                color: mixCol, alpha,
                vx: 0, vy: 0,
                phase: hash01(totalBridges + bi, 1234) * Math.PI * 2,
                lifetime: -1, kFold: 0, kMirror: false,
              });
            }
            bridgeCount.set(pA.id, (bridgeCount.get(pA.id) ?? 0) + 1);
            bridgeCount.set(pB.id, (bridgeCount.get(pB.id) ?? 0) + 1);
            totalBridges++;
          }
        }
        if (totalBridges >= maxBridges) break;
      }
    }
  }

  // PHASE 3: Sub-Pattern Bridges
  if (emergence > 0.25) {
    const subEmergence = (emergence - 0.25) / 0.75;
    const subThreshold = proximityThreshold * 0.6;
    const maxSubBridges = Math.floor(lerp(2, 30, subEmergence * subEmergence));
    let subTotal = 0;

    for (let i = 0; i < fractalPlanets.length && subTotal < maxSubBridges; i++) {
      for (let j = i + 1; j < fractalPlanets.length && subTotal < maxSubBridges; j++) {
        const pA = fractalPlanets[i]!;
        const pB = fractalPlanets[j]!;
        const anchorsA = planetAnchors.get(pA.id) ?? [];
        const anchorsB = planetAnchors.get(pB.id) ?? [];
        const colA = PLANET_MAP.get(pA.id)!.color;
        const colB = PLANET_MAP.get(pB.id)!.color;
        const mixCol: [number, number, number] = [
          (colA[0] + colB[0]) * 0.5,
          (colA[1] + colB[1]) * 0.5,
          (colA[2] + colB[2]) * 0.5,
        ];

        for (const aA of anchorsA) {
          for (const aB of anchorsB) {
            if (subTotal >= maxSubBridges) break;
            const dist = Math.hypot(aA.x - aB.x, aA.y - aB.y);
            if (dist < subThreshold && dist > 0.01) {
              const strength = 1 - dist / subThreshold;
              const sCount = Math.round(lerp(3, 8, strength));
              for (let si = 0; si < sCount; si++) {
                const t = si / (sCount - 1 || 1);
                const px = lerp(aA.x, aB.x, t);
                const py = lerp(aA.y, aB.y, t);
                subBridges.push({
                  x: px, y: py, baseX: px, baseY: py,
                  planetId: pA.id, layer: 'bridge',
                  r: lerp(0.2, 0.5, strength),
                  color: mixCol,
                  alpha: lerp(0.03, 0.15, subEmergence) * strength,
                  vx: 0, vy: 0,
                  phase: hash01(subTotal + si, 5678) * Math.PI * 2,
                  lifetime: -1, kFold: 0, kMirror: false,
                });
              }
              subTotal++;
            }
          }
          if (subTotal >= maxSubBridges) break;
        }
      }
    }
  }

  // PHASE 1: Balancing Center Jumps
  const counts = Array.from(bridgeCount.values());
  const maxBC = Math.max(...counts, 1);
  const minBC = Math.min(...counts);
  const avgBC = counts.reduce((s, c) => s + c, 0) / counts.length;
  const imbalanceRatio = (maxBC - minBC) / maxBC;
  const imbalanceTrigger = lerp(0.5, 0.15, emergence);
  const shouldJump = imbalanceRatio > imbalanceTrigger || emergence > 0.6;

  if (shouldJump) {
    fractalPlanets.forEach(fp => {
      const bc = bridgeCount.get(fp.id) ?? 0;
      if (bc > avgBC) return; // Only target under-connected
      const deficit = 1 - bc / maxBC;
      const jumpIntensity = emergence * Math.max(deficit, 0.3);
      const planet = PLANET_MAP.get(fp.id)!;
      const anchors = planetAnchors.get(fp.id) ?? [];
      // Sort anchors by distance to center
      const sorted = [...anchors].sort((a, b) =>
        Math.hypot(a.x, a.y) - Math.hypot(b.x, b.y)
      );
        const lineCount = Math.round(lerp(4, 20, jumpIntensity));
        const targets = sorted.slice(0, lineCount);

        targets.forEach((tgt, ti) => {
          const rawPCount = lerp(8, 25, jumpIntensity);
          const pCount = Math.max(4, Math.floor(rawPCount * Math.max(0.5, budgetMultiplier)));
          for (let pi = 0; pi < pCount; pi++) {
            const t = pi / (pCount - 1 || 1);
          const px = lerp(0, tgt.x, t);
          const py = lerp(0, tgt.y, t);
          centerJumps.push({
            x: px, y: py, baseX: px, baseY: py,
            planetId: fp.id, layer: 'centerjump',
            r: lerp(0.3, 1.2, 1 - t),
            color: planet.color,
            alpha: lerp(0.05, 0.25, jumpIntensity) * (1 - t * 0.5),
            vx: tgt.x * 0.005, vy: tgt.y * 0.005,
            phase: hash01(ti * pCount + pi, 9012) * Math.PI * 2,
            lifetime: -1, kFold: 0, kMirror: false,
          });
        }
      });
    });
  }

  // Zodiac roots for all planets (not just fractal)
  generateZodiacRoots(weights, maxR, zodiacRoots, budgetMultiplier);

  return { emergence, bridges, subBridges, centerJumps, zodiacRoots };
}

function generateZodiacRoots(
  weights: BazodiacWeights,
  maxR: number,
  out: BazParticle[],
  budgetMultiplier: number = 1.0
) {
  weights.ranked.forEach(rp => {
    const planet = PLANET_MAP.get(rp.id)!;
    const sp = computeSpiroParams(planet.hz);
    const rad = planet.zodiacDeg * Math.PI / 180;
    const zx = Math.cos(rad) * maxR * 0.93;
    const zy = Math.sin(rad) * maxR * 0.93;

    // Connect to nearest main anchors
    const mainCount = Math.round(sp.n * 6);
    const anchors = computeAnchors(sp, mainCount, maxR);
    const sorted = [...anchors].sort((a, b) =>
      Math.hypot(a.x - zx, a.y - zy) - Math.hypot(b.x - zx, b.y - zy)
    );
    const lineCount = Math.round(lerp(2, 6, rp.weight));
    const targets = sorted.slice(0, lineCount);

    targets.forEach((tgt, ti) => {
      const pCount = Math.max(3, Math.floor(8 * Math.max(0.5, budgetMultiplier)));
      for (let pi = 0; pi < pCount; pi++) {
        const t = pi / (pCount - 1);
        out.push({
          x: lerp(zx, tgt.x, t), y: lerp(zy, tgt.y, t),
          baseX: lerp(zx, tgt.x, t), baseY: lerp(zy, tgt.y, t),
          planetId: planet.id, layer: 'zodiac',
          r: lerp(0.4, 0.8, 1 - t),
          color: planet.color,
          alpha: lerp(0.08, 0.20, rp.weight) * (1 - t * 0.3),
          vx: 0, vy: 0,
          phase: hash01(ti * 8 + pi, 3456) * Math.PI * 2,
          lifetime: -1, kFold: 0, kMirror: false,
        });
      }
    });
  });
}

// ═══════════════════════════════════════
//  9. KALEIDOSCOPE FOLDING
// ═══════════════════════════════════════

/** Apply kaleidoscope: replicate particle positions N-fold with mirror */
export function applyKaleidoscope(
  particles: BazParticle[],
  kFolds: number
): BazParticle[] {
  if (kFolds <= 1) return particles;
  const kAngle = (2 * Math.PI) / kFolds;
  const alphaScale = 1 / (kFolds * 0.3);
  const result: BazParticle[] = [];

  for (const p of particles) {
    // Skip already-folded or special layers
    if (p.layer === 'transit' || p.layer === 'zodiac') {
      result.push(p);
      continue;
    }

    for (let f = 0; f < kFolds; f++) {
      const angle = f * kAngle;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);

      // Rotation
      const rx = p.baseX * cos - p.baseY * sin;
      const ry = p.baseX * sin + p.baseY * cos;
      result.push({
        ...p,
        x: rx, y: ry, baseX: rx, baseY: ry,
        alpha: p.alpha * alphaScale,
        kFold: f, kMirror: false,
      });

      // Mirror
      const mx = p.baseX * cos + p.baseY * sin;
      const my = -(p.baseX * sin) + p.baseY * cos;
      result.push({
        ...p,
        x: mx, y: my, baseX: mx, baseY: my,
        alpha: p.alpha * alphaScale,
        kFold: f, kMirror: true,
      });
    }
  }

  return result;
}

// ═══════════════════════════════════════
//  10. ZODIAC RING DATA
// ═══════════════════════════════════════

export interface ZodiacSign {
  symbol: string;
  name: string;
  deg: number;
}

export const ZODIAC_SIGNS: ZodiacSign[] = [
  { symbol: '♈', name: 'Aries',       deg: 0 },
  { symbol: '♉', name: 'Taurus',      deg: 30 },
  { symbol: '♊', name: 'Gemini',      deg: 60 },
  { symbol: '♋', name: 'Cancer',      deg: 90 },
  { symbol: '♌', name: 'Leo',         deg: 120 },
  { symbol: '♍', name: 'Virgo',       deg: 150 },
  { symbol: '♎', name: 'Libra',       deg: 180 },
  { symbol: '♏', name: 'Scorpio',     deg: 210 },
  { symbol: '♐', name: 'Sagittarius', deg: 240 },
  { symbol: '♑', name: 'Capricorn',   deg: 270 },
  { symbol: '♒', name: 'Aquarius',    deg: 300 },
  { symbol: '♓', name: 'Pisces',      deg: 330 },
];

// ═══════════════════════════════════════
//  11. TRANSIT OVERLAY
// ═══════════════════════════════════════

export function generateTransitParticles(
  transitPlanetId: string,
  intensity: number,
  maxR: number
): BazParticle[] {
  const planet = PLANET_MAP.get(transitPlanetId);
  if (!planet) return [];
  const sp = computeSpiroParams(planet.hz);
  const particles: BazParticle[] = [];
  const count = 2000;
  const scale = maxR * 0.42;
  const breathScale = 1.0 + 0.15 * Math.sin(intensity * 3);

  for (let i = 0; i < count; i++) {
    const t = (i / count) * 2 * Math.PI * sp.turns;
    const pt = spiroPoint(sp.kind, sp.R, sp.r, sp.d, t);
    const px = pt.x * scale * breathScale;
    const py = pt.y * scale * breathScale;
    // sin² envelope
    const env = Math.sin(intensity * Math.PI);
    const envSq = env * env;

    particles.push({
      x: px, y: py, baseX: px, baseY: py,
      planetId: transitPlanetId, layer: 'transit',
      r: lerp(0.5, 2.0, hash01(planet.hz, i)),
      color: planet.color,
      alpha: lerp(0.05, 0.35, envSq),
      vx: 0, vy: 0,
      phase: hash01(planet.hz, i + 500) * Math.PI * 2,
      lifetime: 8,
      kFold: 0, kMirror: false,
    });
  }

  // Ripples at high intensity
  if (intensity > 0.3) {
    const rippleCount = 5;
    for (let ri = 0; ri < rippleCount; ri++) {
      const rippleR = maxR * (0.2 + ri * 0.15) * intensity;
      for (let ai = 0; ai < 60; ai++) {
        const a = (ai / 60) * Math.PI * 2;
        particles.push({
          x: Math.cos(a) * rippleR, y: Math.sin(a) * rippleR,
          baseX: Math.cos(a) * rippleR, baseY: Math.sin(a) * rippleR,
          planetId: transitPlanetId, layer: 'transit',
          r: 0.4, color: planet.color,
          alpha: 0.15 * (1 - ri / rippleCount),
          vx: 0, vy: 0,
          phase: a, lifetime: 8,
          kFold: 0, kMirror: false,
        });
      }
    }
  }

  return particles;
}

// ═══════════════════════════════════════
//  12. FULL SIGNATURE GENERATION
// ═══════════════════════════════════════

export interface BazodiacSignature {
  particles: BazParticle[];
  weights: BazodiacWeights;
  emergence: EmergenceResult;
  kFolds: number;
  maxR: number;
}

export function generateSignature(
  natal: Map<string, number>,
  quiz: Map<QuizDimension, number>,
  maxR: number = MAX_R,
  enableKaleidoscope = true
): BazodiacSignature {
  const weights = computeWeights(natal, quiz);
  
  // Calculate kFolds based on symmetry
  const dominantSp = computeSpiroParams(weights.dominant.hz);
  const kFolds = enableKaleidoscope ? clamp(Math.round(dominantSp.n), 2, 6) : 1;
  const targetMaxParticles = 35000;
  
  // Budget logic: Maximum ~8000 source particles before folding
  const maxSourceParticles = 8000;
  const multiplier = enableKaleidoscope ? (kFolds * 2) : 1;
  const budgetMultiplier = clamp((targetMaxParticles / multiplier) / maxSourceParticles, 0.15, 1.0);

  // Generate particles per planet
  let allParticles: BazParticle[] = [];
  PLANETS.forEach(p => {
    const w = weights.weights.get(p.id) ?? 0.08;
    const pParticles = generatePlanetParticles(p, w, maxR, budgetMultiplier);
    allParticles.push(...pParticles);
  });

  // Emergence system
  const emergence = computeEmergence(weights, maxR, budgetMultiplier);
  allParticles.push(...emergence.bridges);
  allParticles.push(...emergence.subBridges);
  allParticles.push(...emergence.centerJumps);
  allParticles.push(...emergence.zodiacRoots);

  if (enableKaleidoscope) {
    allParticles = applyKaleidoscope(allParticles, kFolds);
    
    // Safety crop if we somehow exceeded 28,000
    if (allParticles.length > targetMaxParticles) {
      allParticles = allParticles.slice(0, targetMaxParticles);
    }
  }

  return {
    particles: allParticles,
    weights,
    emergence,
    kFolds,
    maxR,
  };
}

// ═══════════════════════════════════════
//  13. TEST PRESET
// ═══════════════════════════════════════

/** Mars:1.0, Jupiter:0.95, Sun:0.93, Saturn:0.45, Mercury:0.25, Venus:0.15, Moon:0.08 */
export function createTestPreset(): { natal: Map<string, number>; quiz: Map<QuizDimension, number> } {
  const natal = new Map<string, number>([
    ['Mars', 1.0],
    ['Jupiter', 0.95],
    ['Sun', 0.93],
    ['Saturn', 0.45],
    ['Mercury', 0.25],
    ['Venus', 0.15],
    ['Moon', 0.08],
  ]);
  // Neutral quiz (no modulation)
  const quiz = new Map<QuizDimension, number>([
    ['empathy', 0.5],
    ['logic', 0.5],
    ['creativity', 0.5],
    ['discipline', 0.5],
    ['intuition', 0.5],
    ['assertion', 0.5],
  ]);
  return { natal, quiz };
}
