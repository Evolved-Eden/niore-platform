import pg from 'pg';
const pool = new pg.Pool({
  host: 'db.jebixydqpvsegvrtfmgm.supabase.co', port: 5432, database: 'postgres',
  user: 'postgres', password: process.argv[2],
  ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 15000,
});

console.log('=== BLUEPRINT TEMPLATES ===');
let r = await pool.query("SELECT key, name FROM blueprint_templates");
for (const x of r.rows) console.log(`  ${(x.key || '').padEnd(35)} ${x.name || ''}`);

console.log('\n=== ESSENCE TEMPLATES ===');
r = await pool.query("SELECT key, name FROM essence_templates");
for (const x of r.rows) console.log(`  ${(x.key || '').padEnd(35)} ${x.name || ''}`);

console.log('\n=== WORKFLOW TEMPLATES (first 15) ===');
r = await pool.query("SELECT key, name, workflow_category FROM workflow_templates LIMIT 15");
for (const x of r.rows) console.log(`  ${(x.key || '').padEnd(35)} ${(x.name || '').padEnd(30)} ${x.workflow_category || ''}`);

// Check agent verticals and their agent_type
console.log('\n=== VERTICAL DISTRIBUTION ===');
r = await pool.query("SELECT vertical, count(*) as cnt, array_agg(DISTINCT agent_type) as types FROM agents GROUP BY vertical ORDER BY cnt DESC");
for (const x of r.rows) console.log(`  ${(x.vertical || 'NULL').padEnd(20)} ${String(x.cnt).padEnd(6)} types: ${(x.types || []).slice(0,4).join(', ')}`);

await pool.end();
