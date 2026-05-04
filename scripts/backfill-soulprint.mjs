#!/usr/bin/env node
/**
 * Backfill astro_profiles.soulprint_sectors for users whose rows predate
 * the upsert fix shipped in Sprint S-SOULPRINT-HOTFIX (2026-04-18).
 *
 * Root cause recap: before the fix, /api/experience/bootstrap used
 * .update().eq('user_id') on astro_profiles, which affected 0 rows when
 * the row didn't exist yet (Superglue-worker race). All onboarding users
 * ended up with soulprint_sectors = NULL and the frontend fell back to
 * a sign-derived synthetic soulprint via DEC-synthetic-soulprint-fallback.
 *
 * This script recomputes each affected user's soulprint from the stored
 * astro_json and upserts it. The fix in the bootstrap endpoint covers
 * all *new* users; this script covers the legacy NULL users.
 *
 * Usage (from repo root):
 *
 *   # Dry-run (default — reads only, prints what would be upserted):
 *   node scripts/backfill-soulprint.mjs
 *   node scripts/backfill-soulprint.mjs --dry-run
 *
 *   # Apply (actually upserts soulprint_sectors):
 *   node scripts/backfill-soulprint.mjs --apply
 *
 * Environment (loaded via dotenv from .env if present):
 *   SUPABASE_URL                  required
 *   SUPABASE_SERVICE_ROLE_KEY     required (service-role key, not anon)
 *
 * The final verification query (COUNT(*) WHERE soulprint_sectors IS NULL)
 * is printed after processing. With --apply, the expected post-state is 0.
 */

import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

// Prevent server.mjs from calling app.listen() when we import it below.
process.env.NODE_ENV = "test";

const { recomputeSoulprintFromAstroJson, persistSoulprintSectors } = await import("../server.mjs");

const APPLY = process.argv.includes("--apply");

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("ERROR: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required in env (or .env).");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

console.log(`Mode:     ${APPLY ? "APPLY (writes enabled)" : "DRY-RUN (no writes, default)"}`);
console.log(`Supabase: ${SUPABASE_URL}`);
console.log("");

const { data: candidates, error: queryErr } = await supabase
  .from("astro_profiles")
  .select("user_id, astro_json")
  .is("soulprint_sectors", null);

if (queryErr) {
  console.error("Query failed:", queryErr.message);
  process.exit(1);
}

if (!candidates || candidates.length === 0) {
  console.log("No rows with NULL soulprint_sectors — nothing to do.");
  process.exit(0);
}

console.log(`Found ${candidates.length} user(s) with soulprint_sectors = NULL\n`);

let success = 0;
let skipped = 0;
let failed = 0;

for (const { user_id, astro_json } of candidates) {
  if (!astro_json || typeof astro_json !== "object") {
    console.log(`  [SKIP] ${user_id}: astro_json missing/invalid`);
    skipped++;
    continue;
  }

  const chart = astro_json.bafe || astro_json;
  if (!chart?.bazi || !chart?.western || !chart?.wuxing) {
    console.log(`  [SKIP] ${user_id}: astro_json missing bazi/western/wuxing subfields`);
    skipped++;
    continue;
  }

  let sectors;
  try {
    sectors = recomputeSoulprintFromAstroJson(chart);
  } catch (err) {
    console.log(`  [FAIL] ${user_id}: recompute threw — ${err.message}`);
    failed++;
    continue;
  }

  if (!Array.isArray(sectors) || sectors.length !== 12) {
    console.log(`  [FAIL] ${user_id}: invalid sector shape (length ${sectors?.length})`);
    failed++;
    continue;
  }

  if (!APPLY) {
    const preview = sectors.map((n) => n.toFixed(2)).join(", ");
    console.log(`  [DRY]  ${user_id}: would upsert [${preview}]`);
    success++;
    continue;
  }

  const { saved } = await persistSoulprintSectors(supabase, user_id, sectors);
  if (saved) {
    console.log(`  [OK]   ${user_id}: upserted 12 sectors`);
    success++;
  } else {
    console.log(`  [FAIL] ${user_id}: persistSoulprintSectors returned saved=false`);
    failed++;
  }
}

console.log("");
console.log(`Summary: ${success} ${APPLY ? "applied" : "would-apply"}, ${skipped} skipped, ${failed} failed`);

const { count, error: verifyErr } = await supabase
  .from("astro_profiles")
  .select("*", { count: "exact", head: true })
  .is("soulprint_sectors", null);

if (verifyErr) {
  console.error("Verification query failed:", verifyErr.message);
  process.exit(1);
}

console.log(`Post-check: ${count ?? "unknown"} row(s) with soulprint_sectors = NULL`);
if (!APPLY) {
  console.log("(Dry-run — no changes were written. Re-run with --apply to execute.)");
}
