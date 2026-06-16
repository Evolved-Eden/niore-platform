const {Pool} = require('pg');
const p = new Pool({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false }
});
(async()=>{
  const r1 = await p.query("SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint WHERE conrelid = 'agents'::regclass AND contype = 'c'");
  console.log('CHECK CONSTRAINTS:'); console.table(r1.rows);
  
  const r2 = await p.query("SELECT data_type, udt_name FROM information_schema.columns WHERE table_name = 'agents' AND column_name = 'agent_type'");
  console.log('\nAGENT_TYPE:'); console.table(r2.rows);
  
  const r3 = await p.query("SELECT data_type, udt_name FROM information_schema.columns WHERE table_name = 'agents' AND column_name = 'orchestration_mode'");
  console.log('\nORCHESTRATION_MODE:'); console.table(r3.rows);
  
  const r4 = await p.query("SELECT data_type, udt_name FROM information_schema.columns WHERE table_name = 'agents' AND column_name = 'vertical_subs'");
  console.log('\nVERTICAL_SUBS:'); console.table(r4.rows);
  
  const r5 = await p.query("SELECT data_type, udt_name FROM information_schema.columns WHERE table_name = 'agents' AND column_name = 'tools'");
  console.log('\nTOOLS:'); console.table(r5.rows);
  
  const r6 = await p.query("SELECT data_type, udt_name FROM information_schema.columns WHERE table_name = 'agents' AND column_name = 'connectors'");
  console.log('\nCONNECTORS:'); console.table(r6.rows);
  
  const r7 = await p.query("SELECT data_type, udt_name FROM information_schema.columns WHERE table_name = 'agents' AND column_name = 'specialties'");
  console.log('\nSPECIALTIES:'); console.table(r7.rows);

  // Check the decision_mode_id type  
  const r8 = await p.query("SELECT data_type, udt_name FROM information_schema.columns WHERE table_name = 'agents' AND column_name = 'decision_mode_id'");
  console.log('\nDECISION_MODE_ID:'); console.table(r8.rows);
  
  // Check agents table defaults
  const r9 = await p.query("SELECT column_name, column_default FROM information_schema.columns WHERE table_name = 'agents' AND column_default IS NOT NULL");
  console.log('\nCOLUMN DEFAULTS:'); console.table(r9.rows);

  await p.end();
})();
