const {Pool}=require('pg');
const p = new Pool({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false }
});

(async()=>{
  // Workflow templates count and sample
  const wf = await p.query("SELECT COUNT(*) as cnt FROM workflow_templates");
  console.log('Total workflows:', wf.rows[0].cnt);

  const wfSamp = await p.query("SELECT key, name, workflow_type, vertical_key, tier, is_active FROM workflow_templates LIMIT 5");
  console.log('\nSample workflows:');
  console.table(wfSamp.rows);

  const wfDist = await p.query("SELECT workflow_type, COUNT(*) as cnt FROM workflow_templates GROUP BY workflow_type ORDER BY cnt DESC");
  console.log('\nWorkflow type distribution:');
  console.table(wfDist.rows);

  // Agent_prompts table check
  const apExists = await p.query("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name='agent_prompts')");
  console.log('\nagent_prompts exists:', apExists.rows[0].exists);

  // Ai_prompts table check
  const aip = await p.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name='ai_prompts'");
  console.log('\nai_prompts columns:');
  console.table(aip.rows);

  // Agent_workflows count
  const awf = await p.query("SELECT COUNT(*) as cnt FROM agent_workflows");
  console.log('\nAgent-workflow links:', awf.rows[0].cnt);

  // Agent_workflows schema
  const awfCols = await p.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name='agent_workflows' ORDER BY ordinal_position");
  console.log('\nAgent-workflows columns:');
  console.table(awfCols.rows);

  // Agent_types primitives count
  const prims = await p.query("SELECT key, name, category FROM agent_types WHERE category='primitive'");
  console.log('\nPrimitive agent types:');
  console.table(prims.rows);

  // Agent_capabilities count
  const caps = await p.query("SELECT COUNT(*) as cnt FROM agent_capabilities");
  console.log('\nCapabilities count:', caps.rows[0].cnt);

  // Check evolved_eden_agents for MAS reference
  const ee = await p.query("SELECT COUNT(*) as cnt FROM evolved_eden_agents");
  console.log('\nEvolved eden agents count:', ee.rows[0].cnt);

  // agents mas_state, state, config current values sample
  const agentStates = await p.query("SELECT agent_id, agent_name, health_status, evolution_status, mas_state, state, autonomous_enabled, orchestration_mode FROM agents LIMIT 10");
  console.log('\nSample agent states:');
  console.table(agentStates.rows);

  await p.end();
})();
