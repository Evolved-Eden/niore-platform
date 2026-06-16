import pg from 'pg';
const pool = new pg.Pool({
  host: 'db.jebixydqpvsegvrtfmgm.supabase.co', port: 5432, database: 'postgres',
  user: 'postgres', password: process.env.SUPABASE_DB_PASSWORD,
  ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 15000,
});

const {rows: constraints} = await pool.query(`
  SELECT conname, pg_get_constraintdef(c.oid) as def
  FROM pg_constraint c
  JOIN pg_class t ON c.conrelid = t.oid
  WHERE t.relname = 'membership_tiers'
`);
console.log('Constraints on membership_tiers:');
for (const c of constraints) {
  console.log(`  ${c.conname}: ${c.def || c.consrc}`);
}

const {rows: cols} = await pool.query(
  "SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_name='membership_tiers' ORDER BY ordinal_position"
);
console.log('\nAll columns:');
for (const c of cols) {
  console.log(`  ${c.column_name.padEnd(30)} ${c.data_type.padEnd(20)} nullable=${c.is_nullable} default=${c.column_default || '-'}`);
}

await pool.end();
