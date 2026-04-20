import { describe, it, expect } from 'vitest';

describe('Dashboard section order — coherence-first layout', () => {
  it('Daily Chart Hero appears before Planetarium in Dashboard.tsx', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync('src/components/Dashboard.tsx', 'utf-8');

    const heroIdx = source.indexOf('DAILY CHART HERO');
    const planetariumIdx = source.indexOf('PLANETARIUM');

    expect(heroIdx, 'DAILY CHART HERO marker should exist').toBeGreaterThan(-1);
    expect(planetariumIdx, 'PLANETARIUM marker should exist').toBeGreaterThan(-1);
    expect(heroIdx, 'DAILY CHART HERO should appear before PLANETARIUM').toBeLessThan(planetariumIdx);
  });

  it('DailyChartHero contains the active impacts section (unified hero)', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync('src/components/dashboard/DailyChartHero.tsx', 'utf-8');

    // Phase 4 (2026-04-20): renamed from `active-planets-section` to
    // `active-impacts-section`; data source switched from API `activePlanets[]`
    // to shared `ActiveImpactsList` (driven by `birthSign` client-side).
    expect(source).toContain('ActiveImpactsList');
    expect(source).toContain('active-impacts-section');
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
    // DailyChartHero replaces COHERENCE HERO + ACTIVE PLANET INFLUENCES + DAY PULSE
    const markers = [
      'DAILY CHART HERO',
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
