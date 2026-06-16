const { Pool } = require('pg');
const pool = new Pool({
  host: 'db.jebixydqpvsegvrtfmgm.supabase.co', port: 5432, database: 'postgres',
  user: 'postgres', password: process.env.SUPABASE_DB_PASSWORD, ssl: { rejectUnauthorized: false }
});

(async () => {
  // Check if the agents table is actually a VIEW or something weird
  const {rows: info} = await pool.query(
    "SELECT table_type, table_schema FROM information_schema.tables WHERE table_schema='public' AND table_name='agents'"
  );
  console.log('agents table type:', info[0]?.table_type);

  // Test the EXACT query the API does
  const { rows: agents, error, count } = await pool.query(
    "SELECT * FROM public.agents ORDER BY agent_id ASC LIMIT 20"
  );
  
  if (error) {
    console.log('Query ERROR:', error.message);
  } else {
    console.log(`\nagents query: ${agents.length} rows returned`);
    console.log('\n=== SAMPLE ROWS (showing key columns) ===');
    agents.forEach(a => {
      const row = {
        agent_id: a.agent_id,
        agent_name: a.agent_name,
        role_type: a.role_type,
        archetype_id: a.archetype_id,
        category: a.category,
        vertical: a.vertical,
        health_status: a.health_status,
        created_at: a.created_at?.toISOString?.()?.split('T')[0]
      };
      console.log('  ' + JSON.stringify(row));
    });
    
    // Check if there's a problem with any column
    const {rows: fullCount} = await pool.query("SELECT count(*)::int as c FROM public.agents");
    console.log(`\nTotal agents in table: ${fullCount[0].c}`);
  }

  // NOW test what happens when using Supabase REST API directly (as the service_role would)
  const https = require('https');
  const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const url = 'https://jebixydqpvsegvrtfmgm.supabase.co/rest/v1/agents?select=agent_id,agent_name,role_type,archetype_id&limit=3';
  
  const result = await new Promise((resolve) => {
    const req = https.get(url, {
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': 'Bearer ' + SERVICE_KEY
      }
    }, (res) => {
      let body = '';
      res.on('data', (d) => body += d);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, count: parsed.length || 0, sample: parsed[0] || null });
        } catch(e) {
          resolve({ status: res.statusCode, body: body.substring(0, 200) });
        }
      });
    });
    req.on('error', (e) => resolve({ error: e.message }));
  });
  console.log('\nSupabase REST API direct test:');
  console.log('  Status:', result.status);
  console.log('  Count:', result.count);
  console.log('  Sample:', JSON.stringify(result.sample || result.body || result.error));

  pool.end();
})();
