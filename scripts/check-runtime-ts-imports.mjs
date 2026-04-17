import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const ALLOWED_EXTENSIONS = new Set(['.js', '.mjs', '.cjs']);
const SKIP_DIRS = new Set([
  '.git',
  'node_modules',
  'dist',
  'coverage',
  'archive',
  'docs',
  'features',
  '1-objectives',
  '2-design',
  '3-code',
  '4-deploy',
  'Sprints',
]);

const importPattern = /(?:from\s+['\"]([^'\"]+)['\"]|import\(\s*['\"]([^'\"]+)['\"]\s*\))/g;
const offenders = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, entry.name);
    const rel = path.relative(ROOT, abs);

    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      walk(abs);
      continue;
    }

    const ext = path.extname(entry.name);
    if (!ALLOWED_EXTENSIONS.has(ext)) continue;

    const code = fs.readFileSync(abs, 'utf8');
    let match;

    while ((match = importPattern.exec(code)) !== null) {
      const specifier = match[1] || match[2] || '';
      if (specifier.endsWith('.ts') || specifier.endsWith('.tsx')) {
        offenders.push({
          file: rel,
          specifier,
        });
      }
    }
  }
}

walk(ROOT);

if (offenders.length > 0) {
  console.error('[check-runtime-ts-imports] Found TypeScript imports inside JS runtime files:');
  for (const offender of offenders) {
    console.error(` - ${offender.file}: ${offender.specifier}`);
  }
  console.error('\nFix: JS/MJS/CJS runtime files must import runtime JS artifacts only.');
  process.exit(1);
}

console.log('[check-runtime-ts-imports] OK: no .ts/.tsx imports in JS runtime files.');
