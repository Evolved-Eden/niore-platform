const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  // All agent_types, key only
  const r = await pool.query('SELECT * FROM agent_types ORDER BY key');
  console.log('=== ALL AGENT_TYPE KEYS ===');
  for (const row of r.rows) {
    console.log(`${row.key} → ${row.name || row.slug || row.description?.substring(0,50)}`);
  }

  // evolution_statuses table
  try {
    const r2 = await pool.query('SELECT * FROM evolution_statuses ORDER BY key');
    console.log('\n=== EVOLUTION STATUSES ===');
    console.table(r2.rows);
  } catch(e) { console.log('evolution_statuses:', e.message); }

  // role_types table
  try {
    const r3 = await pool.query('SELECT * FROM role_types ORDER BY name');
    console.log('\n=== ROLE_TYPES ===');
    console.table(r3.rows);
  } catch(e) { console.log('role_types:', e.message); }

  // Check if there's an agent_type_enum values list
  const r4 = await pool.query("SELECT enumlabel FROM pg_enum WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'agent_type_enum') ORDER BY enumlabel");
  console.log('\n=== AGENT_TYPE_ENUM VALUES ===');
  console.table(r4.rows);

  // Get distinct verticals in evolved_eden_agents
  const r5 = await pool.query('SELECT DISTINCT vertical FROM evolved_eden_agents WHERE vertical IS NOT NULL AND vertical NOT IN (\'reserved\') ORDER BY vertical');
  console.log('\n=== EE VERTICALS ===');
  console.table(r5.rows);

  // Check if there are any named agents with specific role types for the agent_type mapping
  const r6 = await pool.query('SELECT agent_name, vertical, role_type FROM agents WHERE role_type = \'BRIDGE\' LIMIT 10');
  console.log('\n=== BRIDGE AGENTS (10) ===');
  console.table(r6.rows);

  // See if there's a "systems" table
  try {
    const r7 = await pool.query('SELECT * FROM systems ORDER BY key LIMIT 20');
    console.log('\n=== SYSTEMS ===');
    console.table(r7.rows);
  } catch(e) { console.log('systems:', e.message); }

  // Check if agent_definitions has relevant mapping
  try {
    const r8 = await pool.query('SELECT * FROM agent_definitions LIMIT 10');
    console.log('\n=== AGENT_DEFINITIONS (10) ===');
    console.table(r8.rows);
  } catch(e) { console.log('agent_definitions:', e.message); }

  await pool.end();
}

main().catch(e => { console.error(e); process.exit(1); });
