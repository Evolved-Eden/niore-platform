const {Pool}=require('pg');
const p = new Pool({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false }
});
(async()=>{
  // Check org columns fully
  const orgCols = await p.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name='organizations'");
  console.log('ORGANIZATIONS columns:'); console.table(orgCols.rows);
  const orgData = await p.query("SELECT id, name, slug, industry FROM organizations");
  console.log('\nOrganizations:'); console.table(orgData.rows);

  // Check user columns fully  
  const userCols = await p.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name='users'");
  console.log('\nUSERS columns:'); console.table(userCols.rows);
  const userData = await p.query("SELECT id, full_name, email FROM users LIMIT 4");
  console.log('\nUsers:'); console.table(userData.rows);

  // Check organization_members fully
  const omCols = await p.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name='organization_members'");
  console.log('\nORG MEMBERS columns:'); console.table(omCols.rows);

  // Check if there's an agent_deployments or agent_routes table
  for (const t of ['agent_deployments','agent_routes','agent_swarms','swarm_agents','agent_verticals','agent_definitions','agent_tools','connectors']) {
    const exists = await p.query("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name=$1)", [t]);
    if (exists.rows[0].exists) {
      const cnt = await p.query(`SELECT COUNT(*) as cnt FROM "${t}"`);
      const cols = await p.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name=$1 ORDER BY ordinal_position LIMIT 3`, [t]);
      console.log(`\n${t}: ${cnt.rows[0].cnt} rows - ${cols.rows.map(r=>r.column_name).join(', ')}`);
    }
  }
  await p.end();
})();
