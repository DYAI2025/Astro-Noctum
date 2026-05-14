#!/usr/bin/env node
/**
 * Seed the Supabase `aphorisms` table from the JSON built in Phase A.
 *
 * Idempotent: uses upsert with onConflict: 'id', so re-running this script
 * does not create duplicates — it overwrites with the latest content.
 *
 * Source: apps/tagespuls_package/packages/voice/data/aphorisms.json
 *         (built from 21 markdown files by scripts/build-aphorisms-json.mjs)
 *
 * Target: aphorisms table created by the Phase B migration
 *         (supabase-migrations/2026-05-09_tagespuls_tables.sql)
 *
 * Usage (from repo root):
 *
 *   npm run seed:aphorisms
 *
 *   # Or directly:
 *   node --env-file=.env scripts/seed-aphorisms.mjs
 *
 * Environment (loaded via --env-file=.env):
 *   SUPABASE_URL                  required
 *   SUPABASE_SERVICE_ROLE_KEY     required (service-role key, not anon)
 *
 * word_count_de / word_count_en are computed inline from the actual text —
 * frontmatter values in the markdown sources are documentation only and not
 * load-bearing for the seeded data.
 *
 * Phase C of Tagespuls no-placeholders implementation (2026-05-09).
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env');
  console.error('Run with: node --env-file=.env scripts/seed-aphorisms.mjs');
  console.error('         (or: npm run seed:aphorisms)');
  process.exit(1);
}

const dataPath = resolve('apps/tagespuls_package/packages/voice/data/aphorisms.json');
const data = JSON.parse(readFileSync(dataPath, 'utf8'));

const client = createClient(url, key, { auth: { persistSession: false } });

let inserted = 0;
let failed = 0;
for (const a of data) {
  // Compute word counts from the actual text — derive, don't trust frontmatter.
  const word_count_de = a.text.de.split(/\s+/).filter(Boolean).length;
  const word_count_en = a.text.en.split(/\s+/).filter(Boolean).length;

  const row = {
    id: a.id,
    status: a.status,
    text_de: a.text.de,
    text_en: a.text.en,
    text_original: a.text.original ?? null,
    author: a.source.author,
    work: a.source.work ?? null,
    year: a.source.year ?? null,
    original_language: a.source.original_language,
    translator_de: a.source.translator_de ?? null,
    translator_en: a.source.translator_en ?? null,
    copyright: a.copyright,
    attribution_status: a.attribution_status,
    attribution_note: a.attribution_note ?? null,
    mode_tags: a.mode_tags,
    tone_tags: a.tone_tags ?? [],
    element_affinity: a.element_affinity ?? [],
    figure_affinity: a.figure_affinity ?? [],
    season_affinity: a.season_affinity ?? [],
    word_count_de,
    word_count_en,
    quality_rating: a.quality_rating,
    cooldown_days: a.cooldown_days ?? 30,
  };
  const { error } = await client.from('aphorisms').upsert(row, { onConflict: 'id' });
  if (error) {
    console.error(`Failed to seed ${a.id}: ${error.message}`);
    failed++;
  } else {
    inserted++;
  }
}
console.log(`Seeded ${inserted}/${data.length} aphorisms (${failed} failed)`);
process.exit(failed > 0 ? 1 : 0);
