// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { execSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// NOTE: All "secret-looking" fixtures in this file are synthesised at
// runtime via string concatenation. This preserves the test intent
// (the scanner must still detect them when written to disk) while
// preventing repo-level secret scanners (GitHub secret scanning,
// GitLeaks, Trufflehog) from false-flagging the test source itself.

const SCRIPT = './scripts/check-secret-leak.mjs';

let fixtureDir;

beforeEach(() => {
  fixtureDir = mkdtempSync(join(tmpdir(), 'secret-scan-'));
});

afterEach(() => {
  rmSync(fixtureDir, { recursive: true, force: true });
});

function run(dir) {
  try {
    const stdout = execSync(`node ${SCRIPT} ${dir}`, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    return { code: 0, stdout, stderr: '' };
  } catch (err) {
    return {
      code: err.status,
      stdout: err.stdout?.toString() ?? '',
      stderr: err.stderr?.toString() ?? '',
    };
  }
}

describe('check-secret-leak.mjs', () => {
  it('SECRET-SCAN-001: exits 2 when target directory does not exist', () => {
    const result = run(join(fixtureDir, 'nonexistent'));
    expect(result.code).toBe(2);
    expect(result.stderr).toMatch(/dist directory not found/);
  });

  it('SECRET-SCAN-002: exits 0 on a clean directory', () => {
    writeFileSync(join(fixtureDir, 'app.js'), 'const safe = "hello world";');
    writeFileSync(join(fixtureDir, 'index.html'), '<html><head></head></html>');
    const result = run(fixtureDir);
    expect(result.code).toBe(0);
    expect(result.stdout).toMatch(/no secret patterns detected/);
  });

  it('SECRET-SCAN-003: detects Stripe live secret key', () => {
    const stripeSecret = 'sk_' + 'live_' + 'abcdefghijklmnopqrstuvwxyz1234567890';
    writeFileSync(join(fixtureDir, 'leak.js'), `const k = "${stripeSecret}";`);
    const result = run(fixtureDir);
    expect(result.code).toBe(1);
    expect(result.stderr).toMatch(/STRIPE_SECRET_KEY/);
  });

  it('SECRET-SCAN-004: detects Stripe webhook secret', () => {
    const webhookSecret = 'whsec_' + 'abcdefghijklmnopqrstuvwxyz1234';
    writeFileSync(join(fixtureDir, 'leak.js'), `const w = "${webhookSecret}";`);
    const result = run(fixtureDir);
    expect(result.code).toBe(1);
    expect(result.stderr).toMatch(/STRIPE_WEBHOOK_SECRET/);
  });

  it('SECRET-SCAN-005: detects Gemini API key shape', () => {
    // Real Gemini key shape: AIza + exactly 35 chars (39 total)
    const geminiKey = 'AI' + 'za' + 'SyAbCdEfGhIjKlMnOpQrStUvWxYz012345_';
    writeFileSync(join(fixtureDir, 'leak.js'), `const g = "${geminiKey}";`);
    const result = run(fixtureDir);
    expect(result.code).toBe(1);
    expect(result.stderr).toMatch(/GEMINI_API_KEY/);
  });

  it('SECRET-SCAN-006: detects OpenRouter API key shape', () => {
    const orKey = 'sk-' + 'or-v1-' + '0123456789abcdef0123456789abcdef0123456789abcdef';
    writeFileSync(join(fixtureDir, 'leak.js'), `const o = "${orKey}";`);
    const result = run(fixtureDir);
    expect(result.code).toBe(1);
    expect(result.stderr).toMatch(/OPENROUTER_API_KEY/);
  });

  it('SECRET-SCAN-007: allows public Stripe pk_live keys', () => {
    // Public-facing publishable keys MUST stay allowed — exercise the allowlist.
    const pubKey = 'pk_' + 'live_' + 'publishablekey1234567890abcdef';
    writeFileSync(join(fixtureDir, 'app.js'), `const pub = "${pubKey}";`);
    const result = run(fixtureDir);
    expect(result.code).toBe(0);
  });

  it('SECRET-SCAN-008: allows Supabase anon JWT (short third segment)', () => {
    // Anon JWT shape — kept BELOW 280-char signature so the scanner allows it
    // through. Header + payload assembled at runtime so the source file
    // doesn't contain the contiguous JWT literal.
    const jwtPrefix = 'eyJ';
    const shortAnon =
      jwtPrefix + 'hbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
      jwtPrefix + 'yb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwic3ViIjoiMTIzIiwiaWF0IjoxNjAwMDAwMDAwfQ.' +
      'a'.repeat(60);
    writeFileSync(join(fixtureDir, 'env.js'), `const k = "${shortAnon}";`);
    const result = run(fixtureDir);
    expect(result.code).toBe(0);
  });

  it('SECRET-SCAN-009: flags Supabase service-role JWT (long third segment)', () => {
    // Service-role JWT — same shape but third segment ≥280 chars (signature
    // grows with the longer payload). Assembled at runtime.
    const jwtPrefix = 'eyJ';
    const serviceRole =
      jwtPrefix + 'hbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
      jwtPrefix + 'yb2xlIjoic2VydmljZV9yb2xlIiwiaXNzIjoic3VwYWJhc2UifQ.' +
      'b'.repeat(300);
    writeFileSync(join(fixtureDir, 'env.js'), `const k = "${serviceRole}";`);
    const result = run(fixtureDir);
    expect(result.code).toBe(1);
    expect(result.stderr).toMatch(/SUPABASE_SERVICE_ROLE_KEY/);
  });

  it('SECRET-SCAN-010: scans only known extensions (skips images, fonts)', () => {
    // Put a fake "secret" inside a binary-like extension; should NOT be scanned.
    const bytes = 'sk_' + 'live_' + 'aaaaaaaaaaaaaaaaaaaaaaaaaaaa';
    writeFileSync(join(fixtureDir, 'image.png'), bytes);
    const result = run(fixtureDir);
    expect(result.code).toBe(0);
  });

  it('SECRET-SCAN-011: recurses into subdirectories', () => {
    const sub = join(fixtureDir, 'assets', 'nested');
    execSync(`mkdir -p "${sub}"`);
    const webhookSecret = 'whsec_' + 'abcdefghijklmnopqrstuvwxyz1234';
    writeFileSync(join(sub, 'leak.js'), `const w = "${webhookSecret}";`);
    const result = run(fixtureDir);
    expect(result.code).toBe(1);
  });
});
