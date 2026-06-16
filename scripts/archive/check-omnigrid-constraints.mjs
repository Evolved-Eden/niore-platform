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
    SELECT conname, contype, conrelid::regclass AS table, pg_get_constraintdef(oid) AS definition
    FROM pg_constraint
    WHERE conrelid = 'public.omnigrid_intelligence_system'::regclass;
  `);
  console.log(JSON.stringify(res.rows, null, 2));
  const res2 = await client.query(`
    SELECT a.attname, format_type(a.atttypid, a.atttypmod) AS type
    FROM pg_attribute a
    WHERE a.attrelid = 'public.omnigrid_intelligence_system'::regclass
      AND a.attnum > 0
      AND NOT a.attisdropped;
  `);
  console.log(JSON.stringify(res2.rows, null, 2));
  client.release();
} catch (e) {
  console.error('ERR', e.message);
} finally {
  await pool.end();
}
