import { describe, it, expect } from 'vitest';

describe('Orrery container aspect ratio', () => {
  it('container has aspect-[16/10] class for proper window proportion', async () => {
    // We can't mount BirthChartOrrery in JSDOM (Three.js needs WebGL),
    // so we do a static grep-style verification that the class is present
    const fs = await import('fs');
    const source = fs.readFileSync(
      'src/components/BirthChartOrrery.tsx', 'utf-8'
    );
    expect(source).toContain('aspect-[16/10]');
  });

  it('CSS defines orrery-canvas-container with min-height', async () => {
    const fs = await import('fs');
    const css = fs.readFileSync('src/index.css', 'utf-8');
    expect(css).toContain('.orrery-canvas-container');
    expect(css).toMatch(/min-height:\s*3[0-9]{2}px/);
  });

  it('fallback container also uses aspect ratio class', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync(
      'src/components/BirthChartOrrery.tsx', 'utf-8'
    );
    // The renderFailed fallback div should also have the aspect class
    const fallbackMatch = source.match(/renderFailed[\s\S]*?aspect-\[16\/10\]/);
    expect(fallbackMatch).not.toBeNull();
  });
});
