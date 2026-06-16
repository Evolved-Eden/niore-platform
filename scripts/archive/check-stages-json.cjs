const {Pool}=require('pg');
const p = new Pool({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false }
});
(async()=>{
  const r=await p.query("SELECT key, stages_json FROM workflow_templates WHERE stages_json IS NOT NULL LIMIT 3");
  r.rows.forEach(r=>console.log(r.key, JSON.stringify(r.stages_json).substring(0,200)));
  // Also check if there are tables already for tenants, users, members, etc.
  const tables = ['tenants','tenant_defaults','routing_rules','integration_endpoints','sla_policies','approval_matrix','workflow_states','state_transitions','model_configs','prompt_versions','execution_templates'];
  for (const t of tables) {
    const exists = await p.query("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name=$1)", [t]);
    console.log(`${t}: ${exists.rows[0].exists}`);
  }
  // Check existing agents_scores or agent_scores tables
  const allTables = await p.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name LIKE '%score%' ORDER BY table_name");
  console.log('\nScore-related tables:', allTables.rows.map(r=>r.table_name).join(', '));
  const permTables = await p.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND (table_name LIKE '%permission%' OR table_name LIKE '%role%' OR table_name LIKE '%policy%') ORDER BY table_name");
  console.log('Permission/role/policy tables:', permTables.rows.map(r=>r.table_name).join(', '));
  await p.end();
})();
