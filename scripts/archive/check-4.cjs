const {Pool} = require('pg');
(async()=>{
const p = new Pool({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false }
});
const r=await p.query("SELECT agent_id, agent_name, tagline FROM agents WHERE tagline LIKE '%intelligent automation%' OR tagline LIKE '% for %'");
for(const row of r.rows) console.log(`${row.agent_id}: ${row.agent_name} → "${row.tagline}"`);
await p.end();
})();
