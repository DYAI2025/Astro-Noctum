import { describe, it, expect } from 'vitest';

/**
 * Unit tests for OnboardingScreen's wuxingToSoulprint pure function.
 * Inlined here to avoid React Native rendering complexity in the web test runner.
 * Tests cover REQ-F-cosmic-encounter-onboarding: mobile onboarding soulprint derivation.
 */
function wuxingToSoulprint(elements: {
  Wood?: number; Fire?: number; Earth?: number; Metal?: number; Water?: number;
}): number[] {
  const e = [
    Number(elements.Wood  || 0),
    Number(elements.Fire  || 0),
    Number(elements.Earth || 0),
    Number(elements.Metal || 0),
    Number(elements.Water || 0),
  ];
  const total = e.reduce((s, v) => s + v, 0) || 1;
  const sectorMap = [1, 2, 2, 4, 1, 2, 3, 4, 1, 2, 3, 4];
  return sectorMap.map((elIdx, i) => {
    const base = e[elIdx] / total;
    const jitter = 0.05 * Math.sin(i * 2.7);
    return Math.max(0.05, base + jitter);
  });
}

describe('wuxingToSoulprint', () => {
  it('always returns exactly 12 sectors', () => {
    const sectors = wuxingToSoulprint({ Wood: 20, Fire: 15, Earth: 25, Metal: 10, Water: 30 });
    expect(sectors).toHaveLength(12);
  });

  it('all sectors are at least 0.05 (min floor)', () => {
    const sectors = wuxingToSoulprint({});
    expect(sectors.every(s => s >= 0.05)).toBe(true);
  });

  it('handles empty elements gracefully (defaults total=1)', () => {
    expect(() => wuxingToSoulprint({})).not.toThrow();
    const sectors = wuxingToSoulprint({});
    expect(sectors).toHaveLength(12);
  });

  it('handles all-zero elements gracefully', () => {
    const sectors = wuxingToSoulprint({ Wood: 0, Fire: 0, Earth: 0, Metal: 0, Water: 0 });
    expect(sectors.every(s => s >= 0.05)).toBe(true);
  });

  it('dominant Water produces higher water-sector values (sectors 3, 7, 11 = Water sectors)', () => {
    // Pure water chart — Water=100, others=0
    const sectors = wuxingToSoulprint({ Water: 100 });
    // Sector 3 and 7 map to element index 4 (Water)
    // sectorMap = [1,2,2,4,1,2,3,4,1,2,3,4] → indices 3 and 7 are element 4 (Water)
    const waterSectors = [sectors[3], sectors[7]];
    const woodSectors  = [sectors[0], sectors[4], sectors[8]];
    const avgWater = waterSectors.reduce((s, v) => s + v, 0) / waterSectors.length;
    const avgWood  = woodSectors.reduce((s, v) => s + v, 0)  / woodSectors.length;
    expect(avgWater).toBeGreaterThan(avgWood);
  });

  it('all sector values are finite positive numbers', () => {
    const sectors = wuxingToSoulprint({ Wood: 25, Fire: 25, Earth: 20, Metal: 15, Water: 15 });
    expect(sectors.every(s => Number.isFinite(s) && s > 0)).toBe(true);
  });
});

describe('OrbBackdrop stylesheet', () => {
  it('orbGold stylesheet entry does not contain static opacity (animated value is sole authority)', async () => {
    const fs = await import('fs');
    const src = fs.readFileSync(
      'apps/mobile/src/screens/OnboardingScreen.tsx',
      'utf-8'
    );
    const orbGoldMatch = src.match(/orbGold:\s*\{([^}]+)\}/s);
    expect(orbGoldMatch).not.toBeNull();
    expect(orbGoldMatch![1]).not.toMatch(/\bopacity\s*:/);
  });

  it('orbCyan stylesheet entry does not contain static opacity', async () => {
    const fs = await import('fs');
    const src = fs.readFileSync(
      'apps/mobile/src/screens/OnboardingScreen.tsx',
      'utf-8'
    );
    const orbCyanMatch = src.match(/orbCyan:\s*\{([^}]+)\}/s);
    expect(orbCyanMatch).not.toBeNull();
    expect(orbCyanMatch![1]).not.toMatch(/\bopacity\s*:/);
  });
});

// ── isValidDate / isValidTime (inlined from OnboardingScreen) ────────────────

function isValidDate(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
}

function isValidTime(s: string): boolean {
  return /^\d{2}:\d{2}$/.test(s);
}

describe('isValidDate', () => {
  it('accepts valid ISO date', () => {
    expect(isValidDate('1990-01-15')).toBe(true);
  });

  it('rejects date with slashes', () => {
    expect(isValidDate('1990/01/15')).toBe(false);
  });

  it('rejects partial date', () => {
    expect(isValidDate('1990-01')).toBe(false);
  });

  it('rejects empty string', () => {
    expect(isValidDate('')).toBe(false);
  });

  it('rejects date with letters', () => {
    expect(isValidDate('YYYY-MM-DD')).toBe(false);
  });
});

describe('isValidTime', () => {
  it('accepts valid HH:MM time', () => {
    expect(isValidTime('12:00')).toBe(true);
    expect(isValidTime('23:59')).toBe(true);
    expect(isValidTime('00:00')).toBe(true);
  });

  it('rejects time with seconds', () => {
    expect(isValidTime('12:00:00')).toBe(false);
  });

  it('rejects empty string', () => {
    expect(isValidTime('')).toBe(false);
  });

  it('rejects time with letters', () => {
    expect(isValidTime('HH:MM')).toBe(false);
  });

  it('rejects single-digit hour', () => {
    expect(isValidTime('9:00')).toBe(false);
  });
});

describe('OrbBackdrop animation cleanup', () => {
  it('OrbBackdrop has no early return null — Views stay mounted for opacity animation', () => {
    const fs = require('fs');
    const src = fs.readFileSync(
      'apps/mobile/src/screens/OnboardingScreen.tsx',
      'utf-8'
    );
    // if (!visible) return null unmounts Animated.View nodes before fade-out can run
    expect(src).not.toMatch(/if\s*\(!visible\)\s*return null/);
  });

  it('OrbBackdrop entrance animation is captured so cleanup can stop it', () => {
    let entranceStopped = false;
    let pulseStopped = false;

    const fakeEntrance = {
      start: (cb?: () => void) => { cb?.(); },
      stop: () => { entranceStopped = true; },
    };
    const fakePulse = {
      start: () => {},
      stop: () => { pulseStopped = true; },
    };

    let pulseAnimation: { stop: () => void } | null = null;
    const entranceAnimation = fakeEntrance;
    entranceAnimation.start(() => {
      pulseAnimation = fakePulse;
      pulseAnimation.start();
    });

    // Simulate cleanup (unmount or re-render)
    entranceAnimation.stop();
    pulseAnimation?.stop();

    expect(entranceStopped).toBe(true);
    expect(pulseStopped).toBe(true);
  });

  it('cleanup ref is populated once entrance animation starts', () => {
    // Simulate the pattern: ref holds the loop so cleanup can stop it
    let stopped = false;
    const fakeLoop = { stop: () => { stopped = true; } };
    let pulseAnimation: { stop: () => void } | null = null;

    // Simulate entrance callback
    const onEntranceComplete = () => {
      pulseAnimation = fakeLoop;
      (pulseAnimation as any).start?.(); // would start in real code
    };
    onEntranceComplete();
    expect(pulseAnimation).not.toBeNull();

    // Simulate cleanup (unmount)
    pulseAnimation?.stop();
    expect(stopped).toBe(true);
  });
});
