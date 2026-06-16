const {Pool} = require('pg');
const p = new Pool({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false }
});
(async()=>{
  // Check all columns types to find array columns
  const r = await p.query("SELECT column_name, data_type, udt_name, ordinal_position FROM information_schema.columns WHERE table_name = 'agents' AND data_type = 'ARRAY' ORDER BY ordinal_position");
  console.log('ALL ARRAY COLUMNS:');
  console.table(r.rows);

  // Columns 63-70
  const r2 = await p.query("SELECT column_name, data_type, udt_name, ordinal_position FROM information_schema.columns WHERE table_name = 'agents' AND ordinal_position BETWEEN 60 AND 72 ORDER BY ordinal_position");
  console.log('\nCOLUMNS 60-72:');
  console.table(r2.rows);

  await p.end();
})();
