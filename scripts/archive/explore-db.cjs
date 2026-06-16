const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  // 1. agents table schema
  const r1 = await pool.query(`SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_name = 'agents' ORDER BY ordinal_position`);
  console.log('=== AGENTS SCHEMA ===');
  console.table(r1.rows);

  // 2. constraints
  const r2 = await pool.query(`SELECT constraint_name, constraint_type FROM information_schema.table_constraints WHERE table_name = 'agents'`);
  console.log('\n=== AGENTS CONSTRAINTS ===');
  console.table(r2.rows);

  // 3. agent_types
  const r3 = await pool.query('SELECT * FROM agent_types ORDER BY key');
  console.log('\n=== AGENT TYPES ===');
  console.table(r3.rows);

  // 4. enum check
  const r4 = await pool.query(`SELECT typname, enumlabel FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE typname LIKE '%role%' OR typname LIKE '%agent%'`);
  console.log('\n=== ENUMS ===');
  console.table(r4.rows);

  // 5. all tables
  const r5 = await pool.query(`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' ORDER BY table_name`);
  console.log('\n=== ALL TABLES ===');
  console.table(r5.rows);

  // 6. swarms schema
  try {
    const r6 = await pool.query(`SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'swarms' ORDER BY ordinal_position`);
    console.log('\n=== SWARMS SCHEMA ===');
    console.table(r6.rows);
  } catch(e) { console.log('No swarms table'); }

  // 7. swarm_agents
  try {
    const r7 = await pool.query(`SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'swarm_agents' ORDER BY ordinal_position`);
    console.log('\n=== SWARM_AGENTS SCHEMA ===');
    console.table(r7.rows);
  } catch(e) { console.log('No swarm_agents table'); }

  // 8. agent_workflows
  try {
    const r8 = await pool.query(`SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'agent_workflows' ORDER BY ordinal_position`);
    console.log('\n=== AGENT_WORKFLOWS SCHEMA ===');
    console.table(r8.rows);
  } catch(e) { console.log('No agent_workflows table'); }

  // 9. workflows
  try {
    const r9 = await pool.query(`SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'workflows' ORDER BY ordinal_position`);
    console.log('\n=== WORKFLOWS SCHEMA ===');
    console.table(r9.rows);
  } catch(e) { console.log('No workflows table'); }

  // 10. evolved_eden_agents schema
  const r10 = await pool.query(`SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'evolved_eden_agents' ORDER BY ordinal_position`);
  console.log('\n=== EVOLVED_EDEN_AGENTS SCHEMA ===');
  console.table(r10.rows);

  // 11. current agent distribution
  const r11 = await pool.query('SELECT role_type, COUNT(*) as count FROM agents GROUP BY role_type ORDER BY COUNT(*) DESC');
  console.log('\n=== AGENTS BY ROLE TYPE ===');
  console.table(r11.rows);

  // 12. distinct verticals
  const r12 = await pool.query('SELECT DISTINCT vertical FROM agents WHERE vertical IS NOT NULL ORDER BY vertical');
  console.log('\n=== DISTINCT VERTICALS ===');
  console.table(r12.rows);

  // 13. tools table
  try {
    const r13 = await pool.query(`SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'tools' ORDER BY ordinal_position`);
    console.log('\n=== TOOLS SCHEMA ===');
    console.table(r13.rows);
  } catch(e) { console.log('No tools table'); }

  // 14. providers table
  try {
    const r14 = await pool.query(`SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'providers' ORDER BY ordinal_position`);
    console.log('\n=== PROVIDERS SCHEMA ===');
    console.table(r14.rows);
  } catch(e) { console.log('No providers table'); }

  // 15. connectors table
  try {
    const r15 = await pool.query(`SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'connectors' ORDER BY ordinal_position`);
    console.log('\n=== CONNECTORS SCHEMA ===');
    console.table(r15.rows);
  } catch(e) { console.log('No connectors table'); }

  // 16. roles table
  try {
    const r16 = await pool.query(`SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'roles' ORDER BY ordinal_position`);
    console.log('\n=== ROLES SCHEMA ===');
    console.table(r16.rows);
  } catch(e) { console.log('No roles table'); }

  // 17. foreign keys for agents
  const r17 = await pool.query(`
    SELECT conname, conrelid::regclass AS table_name, confrelid::regclass AS ref_table, pg_get_constraintdef(oid) AS condef
    FROM pg_constraint WHERE conrelid = 'agents'::regclass AND contype = 'f'
  `);
  console.log('\n=== AGENTS FOREIGN KEYS ===');
  console.table(r17.rows);

  // 18. Sample agents
  const r18 = await pool.query('SELECT agent_id, agent_name, vertical, role_type, archetype_id, avatar, slug FROM agents LIMIT 20');
  console.log('\n=== SAMPLE AGENTS (20) ===');
  console.table(r18.rows);

  // 19. archetypes table
  try {
    const r19 = await pool.query('SELECT * FROM archetypes LIMIT 10');
    console.log('\n=== ARCHETYPES (10) ===');
    console.table(r19.rows);
  } catch(e) { console.log('No archetypes table'); }

  await pool.end();
}

main().catch(e => { console.error(e); process.exit(1); });
