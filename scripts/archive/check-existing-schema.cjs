const {Pool} = require('pg');
(async()=>{
const p = new Pool({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false }
});

// Check agent_capabilities
try {
  const r = await p.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'agent_capabilities' ORDER BY ordinal_position");
  console.log('=== AGENT_CAPABILITIES COLUMNS ===');
  console.table(r.rows);
  const r2 = await p.query('SELECT * FROM agent_capabilities LIMIT 10');
  console.log('\n=== AGENT_CAPABILITIES DATA (10) ===');
  console.table(r2.rows);
} catch(e) { console.log('agent_capabilities:', e.message); }

// Check workflow_definitions
try {
  const r = await p.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'workflow_definitions' ORDER BY ordinal_position");
  console.log('\n=== WORKFLOW_DEFINITIONS COLUMNS ===');
  console.table(r.rows);
  const r2 = await p.query('SELECT * FROM workflow_definitions LIMIT 5');
  console.log('\n=== WORKFLOW_DEFINITIONS DATA (5) ===');
  console.table(r2.rows);
} catch(e) { console.log('workflow_definitions:', e.message); }

// Check agent_types columns
const r3 = await p.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'agent_types' ORDER BY ordinal_position");
console.log('\n=== AGENT_TYPES COLUMNS ===');
console.table(r3.rows);

// Check orchestration_rules for workflow routing
const r4 = await p.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'orchestration_rules' ORDER BY ordinal_position");
console.log('\n=== ORCHESTRATION_RULES COLUMNS ===');
console.table(r4.rows);

await p.end();
})();
