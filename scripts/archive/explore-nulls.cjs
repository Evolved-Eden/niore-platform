const {Pool}=require('pg');
const p = new Pool({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false }
});
(async()=>{
  const tables = ['agents','workflow_templates','swarm_templates','agent_swarms','agent_prompts','agent_capabilities','agent_types'];
  for (const t of tables) {
    console.log(`\n=== ${t} ===`);
    const cols = await p.query(`SELECT column_name FROM information_schema.columns WHERE table_name='${t}' AND table_schema='public' ORDER BY ordinal_position`);
    const total = await p.query(`SELECT count(*) as c FROM "${t}"`);
    const totalCount = total.rows[0].c;
    console.log(`Total rows: ${totalCount}`);
    
    // Check each column for null count
    for (const col of cols.rows) {
      const c = col.column_name;
      if (['id','created_at','updated_at'].includes(c)) continue; // skip ids and timestamps
      const r = await p.query(`SELECT count(*) as c FROM "${t}" WHERE "${c}" IS NULL`);
      const nullCount = r.rows[0].c;
      if (nullCount > 0) {
        const pct = Math.round(nullCount / totalCount * 1000) / 10;
        console.log(`  ${c}: ${nullCount}/${totalCount} NULL (${pct}%)`);
      }
    }
  }
  await p.end();
})();
