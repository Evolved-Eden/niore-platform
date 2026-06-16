import pg from 'pg';
const pool = new pg.Pool({
  host: 'db.jebixydqpvsegvrtfmgm.supabase.co', port: 5432, database: 'postgres',
  user: 'postgres', password: process.env.SUPABASE_DB_PASSWORD,
  ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 15000,
});

const {rows: cols} = await pool.query(
  "SELECT column_name, data_type FROM information_schema.columns WHERE table_name='subscriptions' ORDER BY ordinal_position"
);
console.log('subscriptions columns:', cols.map(c => `${c.column_name} (${c.data_type})`).join('\n'));

const {rows: count} = await pool.query("SELECT COUNT(*)::int as c FROM subscriptions");
console.log('\nsubscriptions count:', count[0].c);

const {rows: sample} = await pool.query("SELECT * FROM subscriptions LIMIT 3");
console.log('\nsample:', JSON.stringify(sample, null, 2));

await pool.end();
