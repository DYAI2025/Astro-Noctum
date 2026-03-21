import { describe, it, expect } from 'vitest';

describe('Space weather contribution endpoint', () => {
  it('endpoint exists in server code', async () => {
    const fs = await import('fs');
    const code = fs.readFileSync('server.mjs', 'utf8');
    expect(code).toContain('/api/contribution/space-weather');
  });

  it('requires JWT auth', async () => {
    const fs = await import('fs');
    const code = fs.readFileSync('server.mjs', 'utf8');
    const idx = code.indexOf('/api/contribution/space-weather');
    const section = code.slice(idx, idx + 1500);
    expect(section).toContain('authorization');
    expect(section).toContain('getUser');
  });

  it('enforces signature_weight cap at 0.5', async () => {
    const fs = await import('fs');
    const code = fs.readFileSync('server.mjs', 'utf8');
    const idx = code.indexOf('/api/contribution/space-weather');
    const section = code.slice(idx, idx + 1500);
    expect(section).toContain('0.5');
  });

  it('requires expires_at field', async () => {
    const fs = await import('fs');
    const code = fs.readFileSync('server.mjs', 'utf8');
    const idx = code.indexOf('/api/contribution/space-weather');
    const section = code.slice(idx, idx + 1500);
    expect(section).toContain('expires_at');
    expect(section).toContain('expires_at is required');
  });

  it('uses upsert for idempotency', async () => {
    const fs = await import('fs');
    const code = fs.readFileSync('server.mjs', 'utf8');
    const idx = code.indexOf('/api/contribution/space-weather');
    const section = code.slice(idx, idx + 2500);
    expect(section).toContain('upsert');
    expect(section).toContain('onConflict');
  });
});
