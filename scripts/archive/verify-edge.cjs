const {Pool} = require('pg');
const p = new Pool({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false }
});
(async()=>{
  // Check edge cases
  const checks = [
    "SELECT agent_id, agent_name, vertical, role_type, agent_type, capabilities, specialties, icon, metadata, mas_score FROM agents WHERE agent_id = 'AGT-400'",
    "SELECT agent_id, agent_name, vertical, role_type, agent_type, tagline, description FROM agents WHERE agent_id = 'AGT-177'",
    "SELECT agent_id, agent_name, vertical, role_type, agent_type, tagline FROM agents WHERE role_type = 'CRISIS' LIMIT 3",
    "SELECT agent_id, agent_name, vertical, role_type, agent_type, tagline FROM agents WHERE role_type = 'CROSS_SYSTEM' LIMIT 3",
    "SELECT agent_id, agent_name, vertical, role_type, agent_type, tagline FROM agents WHERE role_type = 'UTILITY' LIMIT 5",
    "SELECT agent_id, agent_name, vertical, role_type, agent_type, tagline FROM agents WHERE agent_id = 'billing_automation'",
    "SELECT agent_id, agent_name, vertical, role_type, agent_type, tagline FROM agents WHERE agent_id = 'ai_twin_manager'",
  ];
  
  for (const sql of checks) {
    const r = await p.query(sql);
    console.log(`\n--- ${sql.split('WHERE')[1]?.split('LIMIT')[0]?.trim() || sql} ---`);
    for (const row of r.rows) {
      for (const [k,v] of Object.entries(row)) {
        const val = typeof v === 'object' ? JSON.stringify(v).substring(0,100) : String(v).substring(0,100);
        console.log(`  ${k}: ${val}`);
      }
    }
  }

  // Get count of non-null values for ALL columns
  const cols = await p.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'agents' AND is_nullable = 'YES' ORDER BY ordinal_position");
  console.log('\n--- NULL CHECK FOR ALL NULLABLE COLUMNS ---');
  for (const c of cols.rows) {
    const col = c.column_name;
    const r = await p.query(`SELECT COUNT(*) as n FROM agents WHERE ${col} IS NULL`);
    if (parseInt(r.rows[0].n) > 0) {
      console.log(`  ${col}: ${r.rows[0].n} nulls`);
    }
  }
  console.log('  (only non-zero shown)');

  await p.end();
})();
