const {Pool}=require('pg');
const p = new Pool({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false }
});

(async()=>{
  // agent_types all
  const at = await p.query("SELECT * FROM agent_types ORDER BY category, key");
  console.log('=== AGENT TYPES ===');
  at.rows.forEach(r => console.log(`  ${r.key} | ${r.name} | category=${r.category} | is_active=${r.is_active}`));
  console.log(`  Total: ${at.rows.length}\n`);

  // workflow_templates full
  const wf = await p.query("SELECT key, name, vertical_key, workflow_type, tier, is_active FROM workflow_templates ORDER BY key");
  console.log('=== WORKFLOW TEMPLATES ===');
  wf.rows.forEach(r => console.log(`  ${r.key} | ${r.name} | vert=${r.vertical_key} | type=${r.workflow_type} | tier=${r.tier}`));
  console.log(`  Total: ${wf.rows.length}\n`);

  // agent_workflows check - how many per workflow
  const awf = await p.query("SELECT workflow_id, COUNT(*) as cnt FROM agent_workflows GROUP BY workflow_id ORDER BY cnt DESC");
  console.log('=== AGENT-WORKFLOW LINKS PER WORKFLOW ===');
  awf.rows.forEach(r => console.log(`  ${r.workflow_id}: ${r.cnt} agents`));
  console.log(`  Total links: ${awf.rows.reduce((a,r)=>a+parseInt(r.cnt),0)}\n`);

  // Check if frequency/automation_score exist on workflow_templates
  const extra = await p.query("SELECT column_name FROM information_schema.columns WHERE table_name='workflow_templates' AND column_name IN ('frequency','automation_score')");
  console.log('=== MISSING COLUMNS ON WORKFLOW_TEMPLATES ===');
  extra.rows.forEach(r => console.log(`  ${r.column_name} exists`));
  if (extra.rows.length < 2) console.log('  Need to add frequency and/or automation_score\n');

  await p.end();
})();
