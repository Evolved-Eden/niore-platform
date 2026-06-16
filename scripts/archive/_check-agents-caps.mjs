import pg from 'pg';
const pool = new pg.Pool({
  host: 'db.jebixydqpvsegvrtfmgm.supabase.co', port: 5432, database: 'postgres',
  user: 'postgres', password: process.env.SUPABASE_DB_PASSWORD,
  ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 15000,
});

// Check if agent_capabilities has agent_type_id column with values
const {rows: caps} = await pool.query("SELECT id, agent_id, agent_type_key, agent_type_id FROM agent_capabilities WHERE agent_id IS NULL LIMIT 10");
console.log('agent_capabilities with NULL agent_id:');
console.log(JSON.stringify(caps, null, 2));

const {rows: capsNonNull} = await pool.query("SELECT id, agent_id, agent_type_key, agent_type_id FROM agent_capabilities WHERE agent_id IS NOT NULL LIMIT 10");
console.log('\nagent_capabilities with agent_id:');
console.log(JSON.stringify(capsNonNull, null, 2));

// Check all agent_type values
const {rows: types} = await pool.query("SELECT agent_type, count(*) as cnt FROM agents GROUP BY agent_type ORDER BY cnt DESC");
console.log('\nAgent types distribution:');
console.log(JSON.stringify(types, null, 2));

await pool.end();
