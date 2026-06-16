import pg from 'pg';
const pool = new pg.Pool({
  host: 'db.jebixydqpvsegvrtfmgm.supabase.co', port: 5432, database: 'postgres',
  user: 'postgres', password: process.env.SUPABASE_DB_PASSWORD,
  ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 15000,
});

const {rows: cols} = await pool.query(
  "SELECT column_name, data_type FROM information_schema.columns WHERE table_name=$1 ORDER BY ordinal_position",
  ['archetypes']
);
console.log('=== archetypes ===');
console.log(JSON.stringify(cols, null, 2));

const {rows: data} = await pool.query("SELECT * FROM archetypes LIMIT 5");
console.log('\n=== Sample data ===');
console.log(JSON.stringify(data, null, 2));

await pool.end();
