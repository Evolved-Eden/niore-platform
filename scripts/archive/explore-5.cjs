const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  // role_types columns
  const r = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'role_types' ORDER BY ordinal_position");
  console.log('=== ROLE_TYPES COLUMNS ===');
  console.table(r.rows);
  
  // all role_types
  const r2 = await pool.query('SELECT * FROM role_types ORDER BY role_type_id');
  console.log('\n=== ROLE_TYPES ===');
  for (const row of r2.rows) console.log(JSON.stringify(row));

  // evolution_statuses
  const r3 = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'evolution_statuses' ORDER BY ordinal_position");
  console.log('\n=== EVOLUTION_STATUSES COLUMNS ===');
  console.table(r3.rows);

  const r4 = await pool.query('SELECT * FROM evolution_statuses');
  console.log('\n=== EVOLUTION_STATUSES ===');
  for (const row of r4.rows) console.log(JSON.stringify(row));

  // systems columns
  const r5 = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'systems' ORDER BY ordinal_position");
  console.log('\n=== SYSTEMS COLUMNS ===');
  console.table(r5.rows);

  await pool.end();
}

main().catch(e => { console.error(e); process.exit(1); });
