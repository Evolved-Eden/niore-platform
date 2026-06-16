import pg from 'pg';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const password = process.argv[2] || process.env.SUPABASE_DB_PASSWORD;
if (!password) {
  console.error('❌ Usage: node scripts/seed-mas.mjs <SUPABASE_DB_PASSWORD>');
  console.error('   Or set SUPABASE_DB_PASSWORD environment variable');
  process.exit(1);
}

const PROJECT_REF = 'jebixydqpvsegvrtfmgm';
const sql = readFileSync(join(__dirname, 'migration-mas.sql'), 'utf8');

const hosts = [
  { host: `db.${PROJECT_REF}.supabase.co`, port: 5432, user: 'postgres', label: 'Direct' },
  { host: `aws-0-us-west-1.pooler.supabase.com`, port: 6543, user: `postgres.${PROJECT_REF}`, label: 'Pooler' },
  { host: `${PROJECT_REF}.supabase.co`, port: 5432, user: 'postgres', label: 'Direct Alt' },
];

async function run() {
  for (const { host, port, user, label } of hosts) {
    const pool = new pg.Pool({
      host,
      port,
      database: 'postgres',
      user,
      password,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 10000,
    });

    try {
      console.log(`🔌 Connecting via ${label} (${host}:${port})...`);
      const client = await pool.connect();
      console.log(`✅ Connected via ${label}`);

      console.log('📦 Applying MAS migration and seed...');
      await client.query(sql);
      console.log('✅ MAS tables and seed data applied.');

      const { rows } = await client.query(`
        SELECT key, name, created_at FROM public.mas_models WHERE key = 'evolved_eden_mas'
      `);
      console.log('📋 MAS model verified:', rows[0] || 'not found');

      const { rows: scoreRows } = await client.query(`
        SELECT agent_id, mas, status, created_at FROM public.mas_scores WHERE model_key = 'evolved_eden_mas'
      `);
      console.log('📋 MAS sample scores:');
      for (const row of scoreRows) {
        console.log(`  - agent_id=${row.agent_id} mas=${row.mas} status=${row.status}`);
      }

      client.release();
      await pool.end();
      return;
    } catch (error) {
      console.error(`  ❌ ${label} failed:`, error.message);
      await pool.end().catch(() => {});
    }
  }

  console.error('\n❌ All connection methods failed.');
  process.exit(1);
}

run().catch((err) => {
  console.error('Unexpected error:', err.message);
  process.exit(1);
});