import pg from 'pg';
const pool = new pg.Pool({
  host: 'db.jebixydqpvsegvrtfmgm.supabase.co',
  port: 5432, database: 'postgres', user: 'postgres',
  password: process.env.SUPABASE_DB_PASSWORD ,
  ssl: { rejectUnauthorized: false },
});

console.log('=== CURRENT AGENTS SAMPLE (first 3) ===');
const sample = await pool.query('SELECT * FROM agents LIMIT 3');
console.table(sample.rows);

console.log('\n=== ALL COLUMNS with current NULL % ===');
const nullPct = await pool.query(`
  SELECT column_name, data_type, 
         (SELECT COUNT(*) FROM agents WHERE ${c => c.column_name} IS NULL)::float / (SELECT COUNT(*) FROM agents) * 100 as null_pct
  FROM information_schema.columns 
  WHERE table_name = 'agents' 
  ORDER BY ordinal_position
`).catch(() => null);

// Simpler approach - check each column
const cols = await pool.query(`
  SELECT column_name, data_type 
  FROM information_schema.columns 
  WHERE table_name = 'agents' 
  ORDER BY ordinal_position
`);
console.log('Column summary:');
for (const col of cols.rows) {
  const nullCount = await pool.query(`SELECT COUNT(*) FROM agents WHERE "${col.column_name}" IS NULL`);
  const notNull = await pool.query(`SELECT COUNT(*) FROM agents WHERE "${col.column_name}" IS NOT NULL`);
  const hasData = notNull.rows[0].count > 0;
  console.log(`  ${col.column_name} (${col.data_type}): ${hasData ? 'HAS DATA' : 'ALL NULL'} — ${notNull.rows[0].count} / 428 filled`);
}

console.log('\n=== AGENT TYPES (agent_types table) ===');
try {
  const at = await pool.query('SELECT * FROM agent_types ORDER BY name');
  console.table(at.rows);
} catch(e) { console.log('  (error or empty):', e.message); }

console.log('\n=== EXISTING agent_type values in agents ===');
const agentTypes = await pool.query('SELECT DISTINCT agent_type FROM agents WHERE agent_type IS NOT NULL');
console.table(agentTypes.rows);

console.log('\n=== EXISTING orchestration_mode values ===');
const om = await pool.query("SELECT DISTINCT orchestration_mode FROM agents WHERE orchestration_mode IS NOT NULL");
console.table(om.rows);

console.log('\n=== SWARM TABLES ===');
const swarmTables = await pool.query(`
  SELECT table_name FROM information_schema.tables 
  WHERE table_schema = 'public' AND (table_name LIKE '%swarm%' OR table_name LIKE '%workflow%')
  ORDER BY table_name
`);
console.table(swarmTables.rows);

console.log('\n=== SWARM_SESSIONS sample ===');
try {
  const ss = await pool.query('SELECT * FROM agent_swarm_sessions LIMIT 5');
  console.table(ss.rows);
} catch(e) { console.log('  error:', e.message); }

console.log('\n=== AGENT SWARMS sample ===');
try {
  const asw = await pool.query('SELECT * FROM agent_swarms LIMIT 5');
  console.table(asw.rows);
} catch(e) { console.log('  error:', e.message); }

console.log('\n=== SWARM AGENTS sample ===');
try {
  const sa = await pool.query('SELECT * FROM swarm_agents LIMIT 5');
  console.table(sa.rows);
} catch(e) { console.log('  error:', e.message); }

console.log('\n=== WORKFLOW AGENTS sample ===');
try {
  const wa = await pool.query('SELECT * FROM agent_workflows LIMIT 5');
  console.table(wa.rows);
} catch(e) { console.log('  error:', e.message); }

console.log('\n=== WORKFLOWS table ===');
try {
  const wf = await pool.query('SELECT * FROM workflows LIMIT 5');
  console.table(wf.rows);
} catch(e) { console.log('  error:', e.message); }

console.log('\n=== AGENT_TOOLS sample ===');
try {
  const at2 = await pool.query('SELECT * FROM agent_tools LIMIT 10');
  console.table(at2.rows);
} catch(e) { console.log('  error:', e.message); }

console.log('\n=== AGENT_REGISTRY sample (for reference patterns) ===');
try {
  const reg = await pool.query("SELECT agent_id, agent_type, tools, connectors, orchestration_mode, specialties, capabilities FROM agent_registry LIMIT 5");
  console.table(reg.rows);
} catch(e) { console.log('  error:', e.message); }

console.log('\n=== ORGANIZATION AGENTS sample ===');
try {
  const oa = await pool.query('SELECT * FROM organization_agents LIMIT 5');
  console.table(oa.rows);
} catch(e) { console.log('  error:', e.message); }

await pool.end();
