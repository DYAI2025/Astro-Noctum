#!/usr/bin/env node
/**
 * Build aphorisms.json from the 21 markdown sources in
 * apps/tagespuls_package/knowledge/bazodiaac-brain/aphorisms/review/.
 *
 * The user (Ben) has approved all 21 aphorisms. The markdown frontmatter
 * still says status: "draft" or "review" — this script overrides that to
 * "approved" in the JSON output, matching the Aphorism interface in
 * packages/voice/src/types.ts (which only allows status: 'approved').
 *
 * Zero-dep: hand-rolled minimal YAML frontmatter parser.
 */
import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { resolve, join } from 'path';

const REVIEW_DIR = resolve('apps/tagespuls_package/knowledge/bazodiaac-brain/aphorisms/review');
const OUT_PATH = resolve('apps/tagespuls_package/packages/voice/data/aphorisms.json');

/**
 * Parse the YAML frontmatter block at the top of a markdown file.
 * Supports the simple shape used in aph-*.md files:
 *   - one key per line
 *   - string values (optionally double-quoted)
 *   - integer values
 *   - inline arrays: [a, b, c] (with optional quoted strings)
 *   - null literal or empty value -> null
 */
function parseFrontmatter(text) {
  const fmMatch = text.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!fmMatch) throw new Error('No frontmatter found');
  const [, fmText, body] = fmMatch;
  const fm = {};
  for (const line of fmText.split('\n')) {
    const m = line.match(/^([a-z_]+):\s*(.*)$/);
    if (!m) continue;
    const [, key, rawValue] = m;
    const value = rawValue.trim();
    if (value === 'null' || value === '') {
      fm[key] = null;
      continue;
    }
    if (value.startsWith('[') && value.endsWith(']')) {
      const inner = value.slice(1, -1).trim();
      fm[key] = inner
        ? inner.split(',').map((s) => s.trim().replace(/^["']|["']$/g, ''))
        : [];
      continue;
    }
    if (/^-?\d+$/.test(value)) {
      fm[key] = parseInt(value, 10);
      continue;
    }
    fm[key] = value.replace(/^["']|["']$/g, '');
  }
  return { fm, body };
}

/**
 * Extract the body of a "## <heading>" section, up to the next "## " or EOF.
 */
function extractSection(body, heading) {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`## ${escaped}\\s*\\n([\\s\\S]*?)(?=\\n## |$)`, 'm');
  const m = body.match(re);
  return m ? m[1].trim() : null;
}

/**
 * Pull blockquote lines (starting with ">") and join them as a single string.
 */
function extractQuote(section) {
  if (!section) return null;
  const lines = section.split('\n').filter((l) => l.trim().startsWith('>'));
  if (lines.length === 0) return null;
  return lines.map((l) => l.replace(/^>\s?/, '').trim()).join(' ').trim();
}

const files = readdirSync(REVIEW_DIR)
  .filter((f) => f.startsWith('aph-') && f.endsWith('.md'))
  .sort();

const aphorisms = [];
for (const file of files) {
  const text = readFileSync(join(REVIEW_DIR, file), 'utf8');
  const { fm, body } = parseFrontmatter(text);
  const de = extractQuote(extractSection(body, 'DE'));
  const en = extractQuote(extractSection(body, 'EN'));
  const original = extractQuote(extractSection(body, 'Original'));
  if (!de || !en) {
    throw new Error(`${file}: missing DE or EN quote`);
  }
  aphorisms.push({
    id: fm.id,
    status: 'approved', // override frontmatter — user has approved all 21
    text: { de, en, original: original || null },
    source: {
      author: fm.author,
      work: fm.work || null,
      year: fm.year ?? null,
      original_language: fm.original_language,
      translator_de: fm.translator_de || null,
      translator_en: fm.translator_en || null,
    },
    copyright: fm.copyright,
    attribution_status: fm.attribution_status,
    attribution_note: fm.attribution_note || null,
    mode_tags: fm.mode_tags ?? [],
    tone_tags: fm.tone_tags ?? [],
    element_affinity: fm.element_affinity ?? [],
    figure_affinity: fm.figure_affinity ?? [],
    season_affinity: fm.season_affinity ?? [],
    quality_rating: fm.quality_rating,
    first_used: null,
    cooldown_days: fm.cooldown_days ?? 30,
  });
}

writeFileSync(OUT_PATH, JSON.stringify(aphorisms, null, 2) + '\n');
console.log(`Wrote ${aphorisms.length} aphorisms to ${OUT_PATH}`);
