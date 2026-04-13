import { describe, it, expect } from 'vitest';

describe('Dashboard section order — coherence-first layout', () => {
  it('Coherence Hero appears before Planetarium in Dashboard.tsx', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync('src/components/Dashboard.tsx', 'utf-8');

    const coherenceIdx = source.indexOf('COHERENCE HERO');
    const planetariumIdx = source.indexOf('PLANETARIUM');

    expect(coherenceIdx, 'COHERENCE HERO marker should exist').toBeGreaterThan(-1);
    expect(planetariumIdx, 'PLANETARIUM marker should exist').toBeGreaterThan(-1);
    expect(coherenceIdx, 'COHERENCE HERO should appear before PLANETARIUM').toBeLessThan(planetariumIdx);
  });

  it('Active Planet Influences appear before Planetarium', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync('src/components/Dashboard.tsx', 'utf-8');

    const planetsIdx = source.indexOf('ACTIVE PLANET INFLUENCES');
    const planetariumIdx = source.indexOf('PLANETARIUM');

    expect(planetsIdx, 'ACTIVE PLANET INFLUENCES marker should exist').toBeGreaterThan(-1);
    expect(planetsIdx, 'Active planets should appear before Planetarium').toBeLessThan(planetariumIdx);
  });

  it('Orrery is NOT rendered inside DashboardAstroSection', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync(
      'src/components/dashboard/DashboardAstroSection.tsx', 'utf-8'
    );
    expect(source).not.toContain('BirthChartOrrery');
  });

  it('DashboardAstroSection no longer accepts birthDate prop', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync(
      'src/components/dashboard/DashboardAstroSection.tsx', 'utf-8'
    );
    expect(source).not.toMatch(/birthDate\s*[?:]/);
  });
});

describe('Dashboard coherence-first section hierarchy', () => {
  it('sections appear in correct coherence-first order', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync('src/components/Dashboard.tsx', 'utf-8');

    // Coherence-first layout: daily chart data above the fold,
    // Planetarium below as a secondary visualization.
    const markers = [
      'COHERENCE HERO',
      'ACTIVE PLANET INFLUENCES',
      'DAY PULSE',
      'DAILY PULSE NARRATIVE',
      'VIBES',
      'ASTRO AGENTS',
      'BLUEPRINT',
      'STABLE NATAL VALUES',
      'PLANETARIUM',
      'SKY MODE TOGGLE',
      'UPGRADE BANNER',
      'KI-SYNTHESE',
      'SHARE CARD',
    ];

    let lastIdx = -1;
    for (const marker of markers) {
      const idx = source.indexOf(marker);
      expect(idx, `"${marker}" should exist in Dashboard.tsx`).toBeGreaterThan(-1);
      expect(idx, `"${marker}" should come after previous section`).toBeGreaterThan(lastIdx);
      lastIdx = idx;
    }
  });

  it('main container uses tighter spacing than gap-20', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync('src/components/Dashboard.tsx', 'utf-8');
    expect(source).toContain('gap-12');
    expect(source).not.toContain('gap-20');
  });
});
