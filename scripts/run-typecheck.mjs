#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const packageJson = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const scripts = packageJson.scripts ?? {};

const candidates = ['typecheck:src', 'lint'];
const selectedScript = candidates.find((name) => typeof scripts[name] === 'string');

if (!selectedScript) {
  console.error(
    `No typecheck script found. Define one of: ${candidates.join(', ')} in package.json scripts.`
  );
  process.exit(1);
}

console.log(`Running npm script: ${selectedScript}`);
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const result = spawnSync(npmCommand, ['run', selectedScript], { stdio: 'inherit' });

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 1);
