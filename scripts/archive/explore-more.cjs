const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  // Check role_types table
  try {
    const r = await pool.query('SELECT * FROM role_types ORDER BY key');
    console.log('=== ROLE_TYPES ===');
    console.table(r.rows);
  } catch(e) { console.log('role_types error:', e.message); }

  // Check swarms table
  try {
    const r = await pool.query('SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = \'agent_swarms\' ORDER BY ordinal_position');
    console.log('\n=== AGENT_SWARMS SCHEMA ===');
    console.table(r.rows);
    
    const r2 = await pool.query('SELECT * FROM agent_swarms LIMIT 5');
    console.log('\n=== AGENT_SWARMS DATA (5) ===');
    console.table(r2.rows);
  } catch(e) { console.log('agent_swarms error:', e.message); }

  // Check swarm_agents
  try {
    const r = await pool.query('SELECT * FROM swarm_agents LIMIT 5');
    console.log('\n=== SWARM_AGENTS DATA (5) ===');
    console.table(r.rows);
  } catch(e) { console.log('swarm_agents error:', e.message); }

  // Check connectors table
  try {
    const r = await pool.query('SELECT * FROM connectors LIMIT 10');
    console.log('\n=== CONNECTORS DATA (10) ===');
    console.table(r.rows);
  } catch(e) { console.log('connectors error:', e.message); }

  // Check ai_models for providers
  try {
    const r = await pool.query('SELECT * FROM ai_models LIMIT 10');
    console.log('\n=== AI_MODELS (10) ===');
    console.table(r.rows);
  } catch(e) { console.log('ai_models error:', e.message); }

  // Check model_providers
  try {
    const r = await pool.query('SELECT * FROM model_providers LIMIT 20');
    console.log('\n=== MODEL_PROVIDERS (20) ===');
    console.table(r.rows);
  } catch(e) { console.log('model_providers error:', e.message); }

  // Check decision_modes
  try {
    const r = await pool.query('SELECT * FROM decision_modes LIMIT 20');
    console.log('\n=== DECISION_MODES ===');
    console.table(r.rows);
  } catch(e) { console.log('decision_modes error:', e.message); }

  // Check the current agents table for fields that are already populated
  const r = await pool.query(`
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'agents' 
      AND is_nullable = 'YES' 
      AND column_default IS NULL
    ORDER BY ordinal_position
  `);
  console.log('\n=== NULLABLE AGENT FIELDS (no default) ===');
  console.table(r.rows);

  // Sample full row
  const r2 = await pool.query('SELECT * FROM agents LIMIT 3');
  console.log('\n=== FULL AGENT ROW (3) ===');
  for (const row of r2.rows) {
    console.log(JSON.stringify(row, null, 2));
  }

  await pool.end();
}

main().catch(e => { console.error(e); process.exit(1); });
