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
  const res1 = await client.query('SELECT count(*) AS cnt FROM public.omnigrid_intelligence_system');
  const res2 = await client.query('SELECT system_number, count(*) FROM public.omnigrid_intelligence_system GROUP BY system_number HAVING count(*) > 1');
  const res3 = await client.query("SELECT indexname, indexdef FROM pg_indexes WHERE schemaname='public' AND tablename='omnigrid_intelligence_system'");
  console.log('count', res1.rows);
  console.log('dupes', res2.rows);
  console.log('indexes', res3.rows);
  client.release();
} catch (e) {
  console.error('ERR', e.message);
} finally {
  await pool.end();
}
