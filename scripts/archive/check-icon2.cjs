const {Pool} = require('pg');
const p = new Pool({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false }
});
(async()=>{
  const r = await p.query("SELECT column_name, data_type, udt_name, ordinal_position FROM information_schema.columns WHERE table_name = 'agents' AND column_name LIKE '%icon%' ORDER BY ordinal_position");
  console.log('ICON COLUMNS:');
  console.table(r.rows);
  
  // Also show role_type, and all columns around position 35-45
  const r2 = await p.query("SELECT column_name, data_type, udt_name, ordinal_position FROM information_schema.columns WHERE table_name = 'agents' AND ordinal_position BETWEEN 33 AND 50 ORDER BY ordinal_position");
  console.log('\nCOLUMNS 33-50:');
  console.table(r2.rows);
  
  await p.end();
})();
