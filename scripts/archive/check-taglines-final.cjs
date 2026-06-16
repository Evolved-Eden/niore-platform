const {Pool} = require('pg');
(async()=>{
const p = new Pool({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false }
});
const r=await p.query("SELECT agent_id, agent_name, tagline FROM agents WHERE tagline LIKE '% for %' OR tagline LIKE '%intelligent automation%' ORDER BY agent_id");
console.log('Generic/fallback taglines remaining:');
if (r.rows.length === 0) { console.log('  None!'); }
else { for (const row of r.rows) console.log(`  ${row.agent_id}: ${row.agent_name} → "${row.tagline}"`); }
console.log(`\nTotal: ${r.rows.length}`);
const r2=await p.query("SELECT COUNT(*) as total FROM agents");
console.log(`Total agents: ${r2.rows[0].total}`);
await p.end();
})();
