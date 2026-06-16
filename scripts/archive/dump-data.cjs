const { Pool } = require('pg');
const fs = require('fs');
const pool = new Pool({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  // All agents
  const agents = await pool.query('SELECT agent_id, agent_name, vertical, role_type, avatar, archetype_id FROM agents ORDER BY agent_id');
  fs.writeFileSync('./scripts/data/agents.json', JSON.stringify(agents.rows, null, 2));
  console.log(`Agents: ${agents.rows.length}`);

  // All evolved_eden_agents with MAS scores
  const ee = await pool.query('SELECT agent_id, mas, reported_mas, capability, trust, activation, synergy, risk, evolution FROM evolved_eden_agents ORDER BY agent_id');
  fs.writeFileSync('./scripts/data/evolved_eden_agents.json', JSON.stringify(ee.rows, null, 2));
  console.log(`EE Agents: ${ee.rows.length}`);

  // agent_registry (already has rich field data)
  const registry = await pool.query('SELECT * FROM agent_registry');
  fs.writeFileSync('./scripts/data/agent_registry.json', JSON.stringify(registry.rows, null, 2));
  console.log(`Registry: ${registry.rows.length}`);

  // agent_workflows
  const workflows = await pool.query('SELECT * FROM agent_workflows');
  fs.writeFileSync('./scripts/data/agent_workflows.json', JSON.stringify(workflows.rows, null, 2));
  console.log(`Workflows: ${workflows.rows.length}`);

  // workflow_templates
  const templates = await pool.query('SELECT * FROM workflow_templates');
  fs.writeFileSync('./scripts/data/workflow_templates.json', JSON.stringify(templates.rows, null, 2));
  console.log(`Templates: ${templates.rows.length}`);

  // vertical_subs
  const vs = await pool.query('SELECT * FROM vertical_subs');
  fs.writeFileSync('./scripts/data/vertical_subs.json', JSON.stringify(vs.rows, null, 2));
  console.log(`Vert Subs: ${vs.rows.length}`);

  // decision_modes
  const dm = await pool.query('SELECT * FROM decision_modes');
  console.log('\nDecision modes:', dm.rows);

  await pool.end();
  console.log('\nData dumped to scripts/data/');
}

main().catch(e => { console.error(e); process.exit(1); });
