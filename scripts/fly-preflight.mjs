#!/usr/bin/env node

const requiredVars = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
const missing = requiredVars.filter((name) => !process.env[name]);

if (missing.length > 0) {
  console.error(`[fly-preflight] Missing required env vars: ${missing.join(', ')}`);
  console.error('[fly-preflight] Set them in Fly secrets before deploy:');
  console.error(`  fly secrets set ${missing.map((name) => `${name}=<value>`).join(' ')}`);
  process.exit(1);
}

const port = process.env.PORT || '8080';
if (port !== '8080') {
  console.warn(`[fly-preflight] PORT is ${port}. Fly health checks usually expect 8080.`);
}

console.log('[fly-preflight] OK: required runtime env vars are present.');
