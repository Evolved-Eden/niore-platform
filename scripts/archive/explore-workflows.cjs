const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  // Check workflow_definitions
  try {
    const cols = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'workflow_definitions' ORDER BY ordinal_position");
    console.log('=== WORKFLOW_DEFINITIONS COLUMNS ===');
    console.table(cols.rows);
    
    const rows = await pool.query('SELECT * FROM workflow_definitions LIMIT 20');
    console.log('\n=== WORKFLOW_DEFINITIONS (20) ===');
    console.table(rows.rows);
    
    const cnt = await pool.query('SELECT COUNT(*) FROM workflow_definitions');
    console.log(`\nTotal: ${cnt.rows[0].count}`);
  } catch(e) { console.log('workflow_definitions:', e.message); }

  // Check agent_workflows
  try {
    const rows = await pool.query('SELECT * FROM agent_workflows LIMIT 20');
    console.log('\n=== AGENT_WORKFLOWS (20) ===');
    console.table(rows.rows);
    
    const cnt = await pool.query('SELECT COUNT(*) FROM agent_workflows');
    console.log(`Total: ${cnt.rows[0].count}`);
  } catch(e) { console.log('agent_workflows:', e.message); }

  // Check workflow_templates
  try {
    const cols = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'workflow_templates' ORDER BY ordinal_position");
    console.log('\n=== WORKFLOW_TEMPLATES COLUMNS ===');
    console.table(cols.rows);
    
    const rows = await pool.query('SELECT * FROM workflow_templates LIMIT 20');
    console.log('\n=== WORKFLOW_TEMPLATES (20) ===');
    console.table(rows.rows);
    
    const cnt = await pool.query('SELECT COUNT(*) FROM workflow_templates');
    console.log(`Total: ${cnt.rows[0].count}`);
  } catch(e) { console.log('workflow_templates:', e.message); }

  // Check workflow_nodes
  try {
    const rows = await pool.query('SELECT * FROM workflow_nodes LIMIT 10');
    console.log('\n=== WORKFLOW_NODES (10) ===');
    console.table(rows.rows);
    
    const cnt = await pool.query('SELECT COUNT(*) FROM workflow_nodes');
    console.log(`Total: ${cnt.rows[0].count}`);
  } catch(e) { console.log('workflow_nodes:', e.message); }

  // Check orchestrator_rules
  try {
    const rows = await pool.query('SELECT * FROM orchestration_rules LIMIT 10');
    console.log('\n=== ORCHESTRATION_RULES (10) ===');
    console.table(rows.rows);
    
    const cnt = await pool.query('SELECT COUNT(*) FROM orchestration_rules');
    console.log(`Total: ${cnt.rows[0].count}`);
  } catch(e) { console.log('orchestration_rules:', e.message); }

  // Check agent_registry for any workflow references
  try {
    const rows = await pool.query('SELECT * FROM agent_registry LIMIT 10');
    console.log('\n=== AGENT_REGISTRY (10) ===');
    console.table(rows.rows);
    
    const cnt = await pool.query('SELECT COUNT(*) FROM agent_registry');
    console.log(`Total: ${cnt.rows[0].count}`);
  } catch(e) { console.log('agent_registry:', e.message); }

  await pool.end();
}

main().catch(e => { console.error(e); process.exit(1); });
