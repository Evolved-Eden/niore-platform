const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  // role_types table - all rows
  try {
    const r = await pool.query('SELECT * FROM role_types ORDER BY name');
    console.log('=== ROLE_TYPES ===');
    console.table(r.rows);
  } catch(e) { console.log('role_types error:', e.message); }

  // agent_types - remaining rows (full list)
  const r2 = await pool.query('SELECT * FROM agent_types ORDER BY created_at NULLS LAST');
  console.log('\n=== ALL AGENT_TYPES ===');
  console.table(r2.rows);

  // roles table
  const r3 = await pool.query('SELECT * FROM roles ORDER BY key');
  console.log('\n=== ROLES ===');
  console.table(r3.rows);

  // avatars table
  const r4 = await pool.query('SELECT * FROM avatars ORDER BY key');
  console.log('\n=== AVATARS ===');
  console.table(r4.rows);

  // verticals table
  const r5 = await pool.query('SELECT * FROM verticals ORDER BY key LIMIT 45');
  console.log('\n=== VERTICALS ===');
  console.table(r5.rows);

  // vertical_subs table
  try {
    const r6 = await pool.query('SELECT * FROM vertical_subs ORDER BY key LIMIT 30');
    console.log('\n=== VERTICAL_SUBS ===');
    console.table(r6.rows);
  } catch(e) { console.log('vertical_subs error:', e.message); }

  // Count distinct agent_type in agent_types
  const r7 = await pool.query('SELECT COUNT(*) FROM agent_types');
  console.log('\n=== AGENT_TYPES COUNT ===');
  console.table(r7.rows);

  await pool.end();
}

main().catch(e => { console.error(e); process.exit(1); });
