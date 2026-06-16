const {Pool} = require('pg');
const pool = new Pool({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false }
});

(async () => {
  const r = await pool.query(
    "SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_name = 'agents' ORDER BY ordinal_position"
  );
  console.log('=== AGENTS TABLE COLUMNS ===');
  console.table(r.rows);

  const t = await pool.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name"
  );
  console.log('\n=== ALL TABLES ===');
  t.rows.forEach(r => console.log('  ' + r.table_name));

  const c = await pool.query(
    "SELECT column_name FROM information_schema.columns WHERE table_name = 'agents' AND column_name IN ('config_state', 'operational_state')"
  );
  console.log('\n=== STATE COLUMNS EXIST? ===');
  c.rows.forEach(r => console.log('  ' + r.column_name));
  if (c.rows.length === 0) console.log('  None found');

  const pt = await pool.query(
    "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'agent_prompts') as exists_check"
  );
  console.log('\n=== agent_prompts EXISTS? ===', pt.rows[0].exists_check);

  const wfCols = await pool.query(
    "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'workflow_templates' ORDER BY ordinal_position"
  );
  console.log('\n=== WORKFLOW_TEMPLATES COLUMNS ===');
  console.table(wfCols.rows);

  const hs = await pool.query("SELECT health_status, COUNT(*) as cnt FROM agents GROUP BY health_status ORDER BY cnt DESC");
  console.log('\n=== HEALTH STATUS DISTRIBUTION ===');
  console.table(hs.rows);

  // Check what the current state-related fields look like
  const stateFields = await pool.query(
    "SELECT column_name FROM information_schema.columns WHERE table_name = 'agents' AND (column_name LIKE '%state%' OR column_name LIKE '%config%' OR column_name LIKE '%status%')"
  );
  console.log('\n=== STATE/STATUS/CONFIG FIELDS ===');
  stateFields.rows.forEach(r => console.log('  ' + r.column_name));

  await pool.end();
})();
