const {Pool} = require('pg');
(async()=>{
const p = new Pool({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false }
});
try {
  await p.query("UPDATE agents SET icon='test' WHERE agent_id='AGT-001'");
  console.log('UPDATE OK');
  const r = await p.query("SELECT icon, data_type FROM information_schema.columns WHERE table_name='agents' AND column_name='icon'");
  console.log('COLUMN:', r.rows[0]);
  const r2 = await p.query("SELECT icon FROM agents WHERE agent_id='AGT-001'");
  console.log('VALUE:', r2.rows[0]);
} catch(e) { console.error(e.message); }
await p.end();
})();
