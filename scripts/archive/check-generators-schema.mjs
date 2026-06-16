import pg from 'pg';

const pool = new pg.Pool({
  host: 'db.jebixydqpvsegvrtfmgm.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: process.env.SUPABASE_DB_PASSWORD,
  ssl: { rejectUnauthorized: false },
});

try {
  const client = await pool.connect();
  const cols = await client.query(`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_schema='public' AND table_name='generators'
    ORDER BY ordinal_position
  `);
  console.log(JSON.stringify(cols.rows, null, 2));
  client.release();
} catch (e) {
  console.error('ERR', e.message);
} finally {
  await pool.end();
}
