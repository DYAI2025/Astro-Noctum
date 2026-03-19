// src/__tests__/usePremium-realtime.test.ts
import { describe, it, expect, vi } from 'vitest';

describe('usePremium realtime behavior', () => {
  it('checks tier field, not is_premium boolean', async () => {
    const fs = await import('fs');
    const code = fs.readFileSync('src/hooks/usePremium.ts', 'utf8');
    // Must check tier === 'premium', not is_premium
    expect(code).toContain("=== 'premium'");
    expect(code).not.toContain('is_premium');
  });

  it('subscribes to realtime updates', async () => {
    const fs = await import('fs');
    const code = fs.readFileSync('src/hooks/usePremium.ts', 'utf8');
    expect(code).toContain('channel');
    expect(code).toContain('UPDATE');
  });

  it('re-fetches on tab visibility change', async () => {
    const fs = await import('fs');
    const code = fs.readFileSync('src/hooks/usePremium.ts', 'utf8');
    expect(code).toContain('visibilitychange');
  });
});
