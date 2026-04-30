import { describe, it, expect } from 'vitest';
import { execSync } from 'node:child_process';
import * as path from 'node:path';

/**
 * Forbids the dead `bazodiac.com` domain from reappearing in production
 * code, configs, current docs, or marketing assets. Historical plan docs
 * (`docs/plans/2026-04-25-domain-cleanup-bazodiac-space.md`, the older
 * stripe-webhook plan, this plan) are allow-listed because they
 * legitimately document the old state for migration history.
 */
describe('rebrand: no-dead-domain', () => {
  // Paths that may legitimately reference bazodiac.com (historical context only).
  const ALLOWLIST_PATHS = new Set([
    'docs/plans/2026-04-25-domain-cleanup-bazodiac-space.md',
    'docs/plans/2026-04-09-stripe-webhook-merge-and-match-auth.md',
    'docs/plans/2026-04-30-rebrand-review-fixes.md',
    'src/__tests__/no-dead-domain.test.ts',
  ]);

  // Path-prefix patterns that are exempt from the check.
  // Homunculus observation logs are append-only telemetry capturing
  // historical session state — they will always reference past values.
  const ALLOWLIST_PATH_CONTAINS = ['.claude/homunculus/'];

  it('contains no `bazodiac.com` in production code or current docs', () => {
    const repoRoot = path.resolve(__dirname, '../..');
    let output = '';
    try {
      output = execSync(
        // List all files containing the dead domain, tracked by git only.
        // -F: literal string, -I: skip binary, -n: line numbers.
        `git grep -nFI "bazodiac.com"`,
        { cwd: repoRoot, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] },
      );
    } catch (e: unknown) {
      // git grep exits 1 when there are no matches — that's the success path.
      const status = (e as { status?: number }).status;
      if (status === 1) return;
      throw e;
    }

    const offending = output
      .split('\n')
      .filter(Boolean)
      .filter(line => {
        const filePath = line.split(':', 1)[0];
        if (ALLOWLIST_PATHS.has(filePath)) return false;
        if (ALLOWLIST_PATH_CONTAINS.some(p => filePath.includes(p))) return false;
        return true;
      });

    expect(
      offending,
      `Dead domain 'bazodiac.com' reappeared in:\n${offending.join('\n')}\n\n` +
        `If a new historical-plan doc legitimately references it, add the path to ALLOWLIST_PATHS.`,
    ).toEqual([]);
  });
});
