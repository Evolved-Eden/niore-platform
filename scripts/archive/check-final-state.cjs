const {Pool} = require('pg');
(async()=>{
const p = new Pool({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false }
});

console.log('=== AUTONOMOUS ===');
const r=await p.query("SELECT orchestration_mode, autonomous_enabled, COUNT(*) FROM agents GROUP BY orchestration_mode, autonomous_enabled ORDER BY 1");
console.table(r.rows);

console.log('\n=== TEMPERATURES ===');
const r2=await p.query("SELECT temperature, COUNT(*) FROM agents GROUP BY temperature ORDER BY temperature");
console.table(r2.rows);

console.log('\n=== TAGLINES ===');
const r3=await p.query("SELECT COUNT(*) as generic FROM agents WHERE tagline LIKE '%intelligent automation%' OR tagline LIKE '% for %'");
console.log(`  Remaining generic: ${r3.rows[0].generic}`);
const r4=await p.query("SELECT agent_id, agent_name, LEFT(tagline,60) as tagline FROM agents ORDER BY random() LIMIT 5");
console.log('  Sample taglines:');
r4.rows.forEach(r => console.log(`    ${r.agent_id}: ${r.tagline}`));

await p.end();
})();
