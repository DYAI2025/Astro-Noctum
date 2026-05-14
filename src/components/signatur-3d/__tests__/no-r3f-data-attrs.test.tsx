import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('SignatureSphere3D — no data-* on R3F nodes (HOTFIX-A)', () => {
  it('SS3D-NO-DATA-001: source has no data-mesh-role attribute', () => {
    const src = readFileSync(resolve(__dirname, '../SignatureSphere3D.tsx'), 'utf8');
    expect(src).not.toMatch(/data-mesh-role/);
  });
  it('SS3D-NO-DATA-002: source has no data-tint attribute', () => {
    const src = readFileSync(resolve(__dirname, '../SignatureSphere3D.tsx'), 'utf8');
    expect(src).not.toMatch(/data-tint/);
  });
});
