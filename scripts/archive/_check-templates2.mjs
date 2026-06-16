import pg from 'pg';
const pool = new pg.Pool({
  host: 'db.jebixydqpvsegvrtfmgm.supabase.co', port: 5432, database: 'postgres',
  user: 'postgres', password: process.argv[2],
  ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 15000,
});

console.log('=== WORKFLOW TEMPLATES ===');
const r = await pool.query("SELECT key, name FROM workflow_templates ORDER BY key");
for (const x of r.rows) console.log(`  ${(x.key || '').padEnd(40)} ${x.name || ''}`);

console.log('\n=== VERTICAL DISTRIBUTION ===');
const r2 = await pool.query("SELECT vertical, count(*) as cnt, array_agg(DISTINCT agent_type) as types FROM agents GROUP BY vertical ORDER BY cnt DESC");
for (const x of r2.rows) console.log(`  ${(x.vertical || 'NULL').padEnd(20)} ${String(x.cnt).padEnd(6)} types: ${(x.types || []).slice(0,5).join(', ')}`);

console.log('\n=== SAMPLE AGENTS WITH archetype_id ===');
const r3 = await pool.query("SELECT agent_id, agent_name, vertical, archetype_id FROM agents WHERE archetype_id IS NOT NULL LIMIT 5");
for (const x of r3.rows) console.log(`  ${x.agent_id.padEnd(20)} ${(x.agent_name||'').padEnd(30)} ${(x.vertical||'').padEnd(15)} ${x.archetype_id||''}`);

console.log('\n=== ARCHETYPE LIST ===');
const r4 = await pool.query("SELECT archetype_id, archetype_name FROM archetypes");
for (const x of r4.rows) console.log(`  ${x.archetype_id.padEnd(15)} ${x.archetype_name}`);

await pool.end();
