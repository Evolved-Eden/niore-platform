const { Pool } = require('pg');
const pool = new Pool({
  host: 'db.jebixydqpvsegvrtfmgm.supabase.co', port: 5432, database: 'postgres',
  user: 'postgres', password: process.env.SUPABASE_DB_PASSWORD, ssl: { rejectUnauthorized: false }
});

(async () => {
  // 1. Count the damage
  const {rows: nulls} = await pool.query(
    "SELECT count(*)::int as c FROM public.agents WHERE agent_id IS NULL"
  );
  console.log(`Rows with NULL agent_id: ${nulls[0].c}`);

  // 2. Delete bad rows
  const {rowCount: deleted} = await pool.query(
    "DELETE FROM public.agents WHERE agent_id IS NULL"
  );
  console.log(`Deleted ${deleted} null-ID rows`);

  // 3. Remove exact duplicates (same agent_id AND same name AND same role_type)
  const {rowCount: deduped} = await pool.query(`
    DELETE FROM public.agents a
    USING (
      SELECT ctid,
             row_number() OVER (PARTITION BY agent_id, agent_name, role_type, archetype_id ORDER BY ctid) as rn
      FROM public.agents
    ) dups
    WHERE a.ctid = dups.ctid AND dups.rn > 1
  `);
  console.log(`Removed ${deduped} duplicate rows`);

  // 4. Final count
  const {rows: final} = await pool.query(
    "SELECT count(*)::int as c, count(distinct agent_id)::int as distinct_ids FROM public.agents"
  );
  console.log(`\nAfter cleanup: ${final[0].c} rows, ${final[0].distinct_ids} distinct agent_ids`);

  // 5. Verify REST API now works
  const https = require('https');
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const url = 'https://jebixydqpvsegvrtfmgm.supabase.co/rest/v1/agents?select=agent_id,agent_name,role_type&order=agent_id.asc&limit=5';
  const result = await new Promise((resolve) => {
    https.get(url, {
      headers: { 'apikey': SERVICE_KEY, 'Authorization': 'Bearer ' + SERVICE_KEY }
    }, (res) => {
      let body = '';
      res.on('data', (d) => body += d);
      res.on('end', () => resolve({ status: res.statusCode, body: body.substring(0, 400) }));
    }).on('error', (e) => resolve({ error: e.message }));
  });
  console.log(`\nREST API after cleanup: ${result.status}`);
  console.log('First 5 rows:', result.body);

  pool.end();
})();
