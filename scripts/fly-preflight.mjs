#!/usr/bin/env node

import { execFileSync } from 'node:child_process';

const requiredVars = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];

function getFlyAppName() {
  const appFromEnv = process.env.FLY_APP?.trim();
  if (appFromEnv) {
    return appFromEnv;
  }

  console.error('[fly-preflight] Missing Fly app name. Set FLY_APP before running predeploy checks.');
  console.error('[fly-preflight] Example: FLY_APP=bazodiac-fly npm run predeploy:fly');
  process.exit(1);
}

function listFlySecrets(appName) {
  try {
    const raw = execFileSync('flyctl', ['secrets', 'list', '--app', appName, '--json'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    return JSON.parse(raw);
  } catch (error) {
    const stderr = typeof error?.stderr === 'string' ? error.stderr.trim() : '';
    const details = stderr || error.message;
    console.error(`[fly-preflight] Could not read Fly secrets for app "${appName}".`);
    console.error(`[fly-preflight] ${details}`);
    console.error('[fly-preflight] Ensure flyctl is installed and you are authenticated: fly auth login');
    process.exit(1);
  }
}

const appName = getFlyAppName();
const secrets = listFlySecrets(appName);
const secretNames = new Set(secrets.map((secret) => secret.Name));
const missing = requiredVars.filter((name) => !secretNames.has(name));

if (missing.length > 0) {
  console.error(`[fly-preflight] Missing required Fly secrets on app "${appName}": ${missing.join(', ')}`);
  console.error('[fly-preflight] Set them before deploy:');
  console.error(`  fly secrets set --app ${appName} ${missing.map((name) => `${name}=<value>`).join(' ')}`);
  process.exit(1);
}

const port = process.env.PORT || '8080';
if (port !== '8080') {
  console.warn(`[fly-preflight] PORT is ${port}. Fly health checks usually expect 8080.`);
}

console.log(`[fly-preflight] OK: required runtime secrets exist on Fly app "${appName}".`);
