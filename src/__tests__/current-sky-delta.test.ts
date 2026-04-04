import { describe, it, expect } from 'vitest';

describe('BirthChartOrrery currentSky logic', () => {
  it('currentSky blocks isPlaying time-lapse in the animation loop', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync('src/components/BirthChartOrrery.tsx', 'utf-8');

    // The animation loop should use an else-if pattern:
    // if (currentSky) → lock to now
    // else if (isPlaying) → time-lapse
    // This prevents isPlaying from racing ahead of "now"
    const pattern = /if\s*\(currentSkyRef\.current\)\s*\{[\s\S]*?\}\s*else\s+if\s*\(isPlayingRef\.current\)/;
    expect(source).toMatch(pattern);
  });

  it('currentSky useEffect sets simTime to current date', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync('src/components/BirthChartOrrery.tsx', 'utf-8');

    // The useEffect for currentSky should call daysSinceJ2000(new Date())
    expect(source).toContain('if (currentSky)');
    expect(source).toContain('daysSinceJ2000(new Date())');
  });

  it('birth sky and current sky use different simTime sources', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync('src/components/BirthChartOrrery.tsx', 'utf-8');

    // When switching from currentSky back to birth: should restore birthDate time
    expect(source).toContain('setSimTime(daysSinceJ2000(birthDate))');
  });
});
