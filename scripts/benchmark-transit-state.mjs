#!/usr/bin/env node
/**
 * Transit State API Benchmark
 *
 * Validates REQ-PERF: /api/transit-state/:userId p95 < 500ms
 *
 * Usage:
 *   # Against local dev server (port 3001)
 *   node scripts/benchmark-transit-state.mjs
 *
 *   # Against staging/production
 *   BENCHMARK_URL=https://staging.bazodiac.space node scripts/benchmark-transit-state.mjs
 *
 * Requirements:
 *   - Server must be running with valid Supabase + FuFirE connections
 *   - BENCHMARK_USER_ID and BENCHMARK_TOKEN env vars must be set
 *     (get a token via: supabase auth token for a test user)
 */

const BASE_URL = process.env.BENCHMARK_URL || 'http://localhost:3001';
const USER_ID = process.env.BENCHMARK_USER_ID;
const TOKEN = process.env.BENCHMARK_TOKEN;
const CONCURRENCY = parseInt(process.env.BENCHMARK_CONCURRENCY || '5', 10);
const TOTAL_REQUESTS = parseInt(process.env.BENCHMARK_REQUESTS || '50', 10);

if (!USER_ID || !TOKEN) {
  console.error('Required env vars: BENCHMARK_USER_ID, BENCHMARK_TOKEN');
  console.error('Optional: BENCHMARK_URL (default: http://localhost:3001)');
  console.error('Optional: BENCHMARK_CONCURRENCY (default: 5)');
  console.error('Optional: BENCHMARK_REQUESTS (default: 50)');
  process.exit(1);
}

async function makeRequest() {
  const url = `${BASE_URL}/api/transit-state/${USER_ID}`;
  const start = performance.now();
  try {
    const res = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Accept': 'application/json',
      },
    });
    await res.json();
    const elapsed = performance.now() - start;
    const fallback = res.headers.get('X-Transit-Fallback');
    return { elapsed, status: res.status, fallback, ok: res.ok };
  } catch (err) {
    return { elapsed: performance.now() - start, status: 0, fallback: null, ok: false, error: err.message };
  }
}

async function runBatch(batchSize) {
  return Promise.all(Array.from({ length: batchSize }, () => makeRequest()));
}

async function main() {
  console.log(`\n  Transit State API Benchmark`);
  console.log(`  URL:         ${BASE_URL}/api/transit-state/${USER_ID}`);
  console.log(`  Concurrency: ${CONCURRENCY}`);
  console.log(`  Requests:    ${TOTAL_REQUESTS}\n`);

  const results = [];
  let remaining = TOTAL_REQUESTS;

  while (remaining > 0) {
    const batch = Math.min(CONCURRENCY, remaining);
    const batchResults = await runBatch(batch);
    results.push(...batchResults);
    remaining -= batch;
    process.stdout.write(`  Progress: ${results.length}/${TOTAL_REQUESTS}\r`);
  }

  // Compute stats
  const latencies = results.map(r => r.elapsed).sort((a, b) => a - b);
  const successCount = results.filter(r => r.ok).length;
  const fallbackCount = results.filter(r => r.fallback).length;

  const avg = latencies.reduce((a, b) => a + b, 0) / latencies.length;
  const p50 = latencies[Math.floor(latencies.length * 0.50)];
  const p95 = latencies[Math.floor(latencies.length * 0.95)];
  const p99 = latencies[Math.floor(latencies.length * 0.99)];
  const min = latencies[0];
  const max = latencies[latencies.length - 1];

  console.log(`\n  Results:`);
  console.log(`  --------`);
  console.log(`  Success:    ${successCount}/${TOTAL_REQUESTS}`);
  console.log(`  Fallback:   ${fallbackCount}/${TOTAL_REQUESTS}`);
  console.log(`  Min:        ${min.toFixed(1)}ms`);
  console.log(`  Avg:        ${avg.toFixed(1)}ms`);
  console.log(`  p50:        ${p50.toFixed(1)}ms`);
  console.log(`  p95:        ${p95.toFixed(1)}ms`);
  console.log(`  p99:        ${p99.toFixed(1)}ms`);
  console.log(`  Max:        ${max.toFixed(1)}ms`);

  const pass = p95 < 500;
  console.log(`\n  REQ-PERF target (p95 < 500ms): ${pass ? 'PASS' : 'FAIL'} (${p95.toFixed(1)}ms)\n`);

  process.exit(pass ? 0 : 1);
}

main().catch(err => {
  console.error('Benchmark failed:', err);
  process.exit(1);
});
