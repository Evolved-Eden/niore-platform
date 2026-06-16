const {Pool} = require('pg');
(async()=>{
const p = new Pool({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false }
});
const r=await p.query("SELECT data_type, udt_name FROM information_schema.columns WHERE table_name='agents' AND column_name IN ('icon','avatar_id','evolution_status','role_type')");
console.table(r.rows);
await p.end()})();
