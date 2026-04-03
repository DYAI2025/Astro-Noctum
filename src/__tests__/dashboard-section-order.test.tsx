import { describe, it, expect } from 'vitest';

describe('Dashboard section order', () => {
  it('Planetarium section appears before Identity section in Dashboard.tsx', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync('src/components/Dashboard.tsx', 'utf-8');

    const planetariumIdx = source.indexOf('SECTION: PLANETARIUM');
    const identityIdx = source.indexOf('IDENTITY');

    expect(planetariumIdx).toBeGreaterThan(-1);
    expect(identityIdx).toBeGreaterThan(-1);
    expect(planetariumIdx).toBeLessThan(identityIdx);
  });

  it('Orrery is NOT rendered inside DashboardAstroSection', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync(
      'src/components/dashboard/DashboardAstroSection.tsx', 'utf-8'
    );
    // BirthChartOrrery should no longer be imported or rendered
    expect(source).not.toContain('BirthChartOrrery');
  });

  it('DashboardAstroSection no longer accepts birthDate prop', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync(
      'src/components/dashboard/DashboardAstroSection.tsx', 'utf-8'
    );
    // birthDate was only needed for the Orrery
    expect(source).not.toMatch(/birthDate\s*[?:]/);
  });
});
