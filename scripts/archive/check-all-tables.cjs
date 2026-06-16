const {Pool}=require('pg');
const p = new Pool({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false }
});
(async()=>{
  const tables = ['organization_members','workflow_states','state_transitions','routing_rules',
    'sla_policies','approval_matrix','integration_endpoints','model_configs',
    'webhook_endpoints','execution_templates','prompt_versions'];
  for (const t of tables) {
    console.log(`\n=== ${t} ===`);
    const r = await p.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name='${t}' ORDER BY ordinal_position`);
    if (r.rows.length === 0) console.log('  (not found)');
    else r.rows.forEach(c => console.log(`  ${c.column_name}: ${c.data_type}`));
  }
  await p.end();
})();
