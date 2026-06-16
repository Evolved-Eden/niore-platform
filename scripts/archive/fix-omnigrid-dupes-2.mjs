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
  const del = await client.query(`
    DELETE FROM public.omnigrid_intelligence_system
    WHERE slug LIKE 'creator_digital__%'
  `);
  console.log('deleted', del.rowCount);
  const res = await client.query('SELECT count(*) AS cnt FROM public.omnigrid_intelligence_system');
  console.log('remaining', res.rows);
  client.release();
} catch (e) {
  console.error('ERR', e.message);
} finally {
  await pool.end();
}
