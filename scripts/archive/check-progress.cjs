const {Pool}=require('pg');
const p = new Pool({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false }
});
(async()=>{
  const v3=await p.query("SELECT COUNT(*) as cnt FROM agent_types WHERE category='primitive'");
  console.log('Primitives:', v3.rows[0].cnt);
  const v4=await p.query('SELECT COUNT(*) as cnt FROM workflow_templates');
  console.log('Workflow templates:', v4.rows[0].cnt);
  const v5=await p.query('SELECT COUNT(*) as cnt FROM agent_capabilities');
  console.log('Capabilities:', v5.rows[0].cnt);
  const v6=await p.query('SELECT COUNT(*) as cnt FROM agent_workflows');
  console.log('Agent-workflow links:', v6.rows[0].cnt);
  const v7=await p.query('SELECT COUNT(*) as cnt FROM agent_prompts');
  console.log('Agent prompts:', v7.rows[0].cnt);
  const v8=await p.query('SELECT COUNT(*) as cnt FROM agents WHERE prompt_template_id IS NOT NULL');
  console.log('Agents with prompt link:', v8.rows[0].cnt);
  const v9=await p.query("SELECT COUNT(*) as cnt FROM agents WHERE config_state IS NOT NULL AND operational_state IS NOT NULL");
  console.log('Agents with state:', v9.rows[0].cnt);
  const wfDist=await p.query("SELECT workflow_type, COUNT(*) as cnt FROM workflow_templates GROUP BY workflow_type ORDER BY cnt DESC");
  console.log('\nWorkflow type distribution:');
  wfDist.rows.forEach(r=>console.log(`  ${r.workflow_type}: ${r.cnt}`));
  // Check last 30 min of agent_workflows count
  const recent=await p.query("SELECT COUNT(*) as cnt FROM agent_workflows WHERE created_at > now() - interval '30 minutes'");
  console.log('\nRecent links (last 30m):', recent.rows[0].cnt);
  // Check n8n templates
  const n8n=await p.query("SELECT COUNT(*) as cnt FROM workflow_templates WHERE workflow_type='n8n_template'");
  console.log('n8n templates:', n8n.rows[0].cnt);
  await p.end();
})();
