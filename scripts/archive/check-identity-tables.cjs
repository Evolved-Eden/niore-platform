const {Pool}=require('pg');
const p = new Pool({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false }
});
(async()=>{
  // Check organizations/tenants
  for (const t of ['organizations','users','organization_members','clients','businesses']) {
    const colQuery = await p.query(`SELECT column_name FROM information_schema.columns WHERE table_name=$1 ORDER BY ordinal_position LIMIT 5`, [t]);
    const countQuery = await p.query(`SELECT COUNT(*) as cnt FROM "${t}"`);
    console.log(`${t}: ${countQuery.rows[0].cnt} rows, columns: ${colQuery.rows.map(r=>r.column_name).join(', ')}`);
  }
  // Check what workflow_states, routing_rules, sla_policies look like if they exist
  for (const t of ['workflow_states','state_transitions','routing_rules','sla_policies','approval_matrix','integration_endpoints','model_configs','execution_templates']) {
    const exists = await p.query("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name=$1)", [t]);
    if (exists.rows[0].exists) {
      const cols = await p.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name=$1`, [t]);
      console.log(`\n${t} TABLE EXISTS`);
      console.table(cols.rows);
    }
  }
  await p.end();
})();
