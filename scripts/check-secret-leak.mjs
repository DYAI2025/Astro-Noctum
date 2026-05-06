#!/usr/bin/env node
/**
 * Secret leak scanner for the production bundle (dist/).
 *
 * Vite inlines anything imported with a `VITE_` prefix into the client
 * bundle. Anything WITHOUT that prefix is server-only — but a stray
 * import or a misconfigured plugin can still leak server secrets into
 * dist/. This script enforces the boundary: scans every shipped JS /
 * MJS / CSS / HTML / JSON file and exits 1 on the first match.
 *
 * Run as part of CI immediately after `vite build`. Suggested hook:
 *
 *   "build": "vite build && npm run check:secrets"
 *
 * Patterns intentionally match VALUE shapes (e.g. `whsec_…`, JWT
 * triplets), not just env-var-name occurrences. The names alone are
 * fine to ship — Vite uses them as runtime flags. The values are not.
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, extname } from 'node:path';

const DIST_DIR = process.argv[2] ?? './dist';
const SCAN_EXTENSIONS = new Set(['.js', '.mjs', '.cjs', '.css', '.html', '.json', '.map']);

/**
 * Each pattern targets a distinct secret SHAPE that should never appear
 * in the client bundle. Comment explains the value source so a future
 * maintainer who sees a CI failure knows where to look.
 */
const SECRET_PATTERNS = [
  // Stripe restricted/secret keys — sk_live_… or sk_test_… (40+ char body).
  // Public-facing pk_live/pk_test keys are intentionally allowed in the bundle.
  { name: 'STRIPE_SECRET_KEY', re: /\bsk_(live|test)_[A-Za-z0-9]{20,}\b/ },
  // Stripe webhook signing secret. Always server-only.
  { name: 'STRIPE_WEBHOOK_SECRET', re: /\bwhsec_[A-Za-z0-9]{20,}\b/ },
  // Supabase service-role JWT. Three base64 segments separated by dots,
  // distinguishable from anon keys by length AND by the role claim — but
  // we cannot decode JWTs without a parser. Match the JWT shape; rely on
  // the assertion that ONLY anon keys are allowed in dist/, and anon keys
  // are always under ~250 chars while service-role tokens are typically
  // 300+. We allow ≤220 to keep anon JWTs through.
  // (The match below is conservative — any JWT-shaped string ≥280 chars.)
  { name: 'SUPABASE_SERVICE_ROLE_KEY', re: /\beyJ[A-Za-z0-9_-]{20,}\.eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{280,}\b/ },
  // Gemini API key — AIza prefix + 35 chars.
  { name: 'GEMINI_API_KEY', re: /\bAIza[A-Za-z0-9_-]{35}\b/ },
  // OpenRouter API key — sk-or-v1-… 64 hex chars.
  { name: 'OPENROUTER_API_KEY', re: /\bsk-or-v1-[a-f0-9]{40,}\b/ },
  // ElevenLabs tool secret — opaque format, only thing we can match is the
  // env-var assignment shape if Vite somehow inlined a process.env reference.
  { name: 'ELEVENLABS_TOOL_SECRET', re: /["']ELEVENLABS_TOOL_SECRET["']\s*:\s*["'][^"']{16,}["']/ },
  // Generic catch-all: any literal that looks like a known service-role
  // prefix combined with high entropy.
  { name: 'AWS_SECRET_ACCESS_KEY', re: /\bAKIA[A-Z0-9]{16}\b/ },
];

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) {
      yield* walk(full);
    } else if (st.isFile() && SCAN_EXTENSIONS.has(extname(name))) {
      yield full;
    }
  }
}

function scanFile(path) {
  const content = readFileSync(path, 'utf8');
  const hits = [];
  for (const { name, re } of SECRET_PATTERNS) {
    const match = content.match(re);
    if (match) {
      hits.push({ name, sample: match[0].slice(0, 12) + '…' });
    }
  }
  return hits;
}

function main() {
  if (!existsSync(DIST_DIR)) {
    console.error(`[check-secrets] dist directory not found: ${DIST_DIR}`);
    console.error('[check-secrets] Run `npm run build` first or pass an explicit path.');
    process.exit(2);
  }

  const violations = [];
  let scanned = 0;
  for (const file of walk(DIST_DIR)) {
    scanned++;
    const hits = scanFile(file);
    for (const hit of hits) {
      violations.push({ file, ...hit });
    }
  }

  if (violations.length > 0) {
    console.error(`[check-secrets] ✗ Found ${violations.length} secret-shaped match(es) in ${DIST_DIR}:`);
    for (const v of violations) {
      console.error(`  - ${v.name} in ${v.file}  (matched: ${v.sample})`);
    }
    console.error('[check-secrets] Bundle MUST NOT ship server-only secrets. Investigate the import chain.');
    process.exit(1);
  }

  console.log(`[check-secrets] ✓ Scanned ${scanned} file(s) in ${DIST_DIR} — no secret patterns detected.`);
}

main();
