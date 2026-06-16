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
  for (const table of ['omnigrid_system_lenses', 'omnigrid_system_domains']) {
    const exists = await client.query(
      `SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=$1) AS exists`,
      [table]
    );
    console.log(table, exists.rows[0].exists);
    if (exists.rows[0].exists) {
      const rows = await client.query(`SELECT * FROM ${table} ORDER BY 1 LIMIT 200`);
      console.log(`${table} rows:`, JSON.stringify(rows.rows, null, 2));
    }
  }
  client.release();
} catch (e) {
  console.error('ERR', e.message);
} finally {
  await pool.end();
}
