const {Pool} = require('pg');
const p = new Pool({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false }
});
(async()=>{
  const r = await p.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'decision_modes' ORDER BY ordinal_position");
  console.log('DECISION_MODES COLUMNS:'); console.table(r.rows);
  
  // Check if decision_mode_id in agents has a FK
  const r2 = await p.query("SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint WHERE conrelid = 'agents'::regclass");
  console.log('\nALL AGENTS CONSTRAINTS:'); console.table(r2.rows);
  
  await p.end();
})();
