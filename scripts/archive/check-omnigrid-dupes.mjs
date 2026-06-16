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
  const res = await client.query(`
    SELECT system_number, slug, name, id, created_at, updated_at
    FROM public.omnigrid_intelligence_system
    WHERE system_number IN (
      SELECT system_number FROM public.omnigrid_intelligence_system GROUP BY system_number HAVING count(*) > 1
    )
    ORDER BY system_number, slug
  `);
  console.log(JSON.stringify(res.rows, null, 2));
  client.release();
} catch (e) {
  console.error('ERR', e.message);
} finally {
  await pool.end();
}
