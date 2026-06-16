const {Pool}=require('pg');
const p = new Pool({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false }
});
(async()=>{
  const r=await p.query("SELECT column_name,data_type,is_nullable FROM information_schema.columns WHERE table_name='webhook_endpoints' ORDER BY ordinal_position");
  r.rows.forEach(c=>console.log(c.column_name, c.data_type, c.is_nullable));
  await p.end();
})();
