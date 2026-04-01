#!/usr/bin/env node
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const textExtensions = new Set([
  '.md', '.markdown', '.txt', '.yml', '.yaml', '.json', '.jsonc', '.toml',
  '.html', '.htm', '.css', '.scss', '.js', '.mjs', '.cjs', '.ts', '.tsx', '.jsx',
  '.xml', '.csv', '.svg'
]);

const binaryMagicSignatures = [
  { name: 'zip/docx', bytes: [0x50, 0x4b, 0x03, 0x04] },
  { name: 'png', bytes: [0x89, 0x50, 0x4e, 0x47] },
  { name: 'jpeg', bytes: [0xff, 0xd8, 0xff] },
  { name: 'pdf', bytes: [0x25, 0x50, 0x44, 0x46] }
];

const trackedFiles = execSync('git ls-files', { encoding: 'utf-8' })
  .split('\n')
  .filter(Boolean);

const failures = [];

for (const file of trackedFiles) {
  const ext = path.extname(file).toLowerCase();
  if (!textExtensions.has(ext)) continue;

  const buffer = fs.readFileSync(file);

  for (const sig of binaryMagicSignatures) {
    const isMatch = sig.bytes.every((byte, index) => buffer[index] === byte);
    if (isMatch) {
      failures.push(`${file}: has binary signature (${sig.name}) but text extension ${ext}`);
      continue;
    }
  }

  try {
    new TextDecoder('utf-8', { fatal: true }).decode(buffer);
  } catch {
    failures.push(`${file}: invalid UTF-8 content for text extension ${ext}`);
  }
}

if (failures.length > 0) {
  console.error('Text integrity check failed:\n');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(`Text integrity check passed for ${trackedFiles.length} tracked files.`);
