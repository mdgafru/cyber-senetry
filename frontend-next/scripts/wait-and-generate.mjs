/**
 * Polls until services table exists, then generates one article.
 */
import { spawn } from 'child_process';
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

function loadEnv() {
  const raw = readFileSync(resolve(root, '.env.local'), 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i === -1) continue;
    const k = t.slice(0, i).trim();
    const v = t.slice(i + 1).trim();
    if (!process.env[k]) process.env[k] = v;
  }
}

loadEnv();

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function ready() {
  const { error } = await db.from('services').select('id').limit(1);
  return !error;
}

console.log('\n⏳ Waiting for Supabase schema…');
console.log('   1. Open: https://supabase.com/dashboard/project/rlpihzsbxzkhyfzlsufq/sql/new');
console.log('   2. Paste the SQL (already copied if clip worked)');
console.log('   3. File: frontend-next/supabase/migrations/001_initial_schema.sql');
console.log('   4. Click RUN\n');

const deadline = Date.now() + 10 * 60 * 1000;
while (Date.now() < deadline) {
  if (await ready()) {
    console.log('✅ Schema detected. Starting article generation…\n');
    const child = spawn(process.execPath, [resolve(__dirname, 'generate-one.mjs')], {
      cwd: root,
      stdio: 'inherit',
      env: process.env,
    });
    child.on('exit', (code) => process.exit(code || 0));
    return;
  }
  process.stdout.write('.');
  await new Promise((r) => setTimeout(r, 4000));
}

console.error('\n\nTimed out waiting for schema. Run the migration SQL, then:');
console.error('  node scripts/generate-one.mjs\n');
process.exit(1);
