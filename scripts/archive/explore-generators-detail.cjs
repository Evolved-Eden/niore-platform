const {Pool}=require('pg');
const p = new Pool({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false }
});
(async()=>{
  // 1. Sample generators table - what generator_id values do they reference?
  console.log('=== GENERATORS TABLE SAMPLES ===');
  let r = await p.query("SELECT * FROM generators LIMIT 10");
  console.log('Columns:', Object.keys(r.rows[0]).join(', '));
  r.rows.forEach(g=>console.log(' ', JSON.stringify(g)));

  // 2. Layer values distribution
  r = await p.query("SELECT layer, count(*) as cnt FROM generators GROUP BY layer ORDER BY cnt DESC");
  console.log('\n=== GENERATOR LAYERS ===');
  r.rows.forEach(l=>console.log(`  ${l.layer}: ${l.cnt}`));

  // 3. generator_id values distribution
  r = await p.query("SELECT generator_id, count(*) as cnt FROM generators WHERE generator_id IS NOT NULL GROUP BY generator_id ORDER BY cnt DESC");
  console.log('\n=== GENERATOR ID REFS ===');
  r.rows.forEach(g=>console.log(`  ${g.generator_id}: ${g.cnt} instances`));

  // 4. Check gen_id values
  r = await p.query("SELECT gen_id, count(*) as cnt FROM generators WHERE gen_id IS NOT NULL GROUP BY gen_id ORDER BY cnt DESC LIMIT 20");
  console.log('\n=== GEN_ID VALUES ===');
  r.rows.forEach(g=>console.log(`  ${g.gen_id}: ${g.cnt}`));

  // 5. Show names
  r = await p.query("SELECT generator_name FROM generators ORDER BY generator_name LIMIT 20");
  console.log('\n=== GENERATOR NAMES (first 20) ===');
  r.rows.forEach(g=>console.log(`  ${g.generator_name}`));

  // 6. agent_generators rows
  r = await p.query("SELECT * FROM agent_generators");
  console.log('\n=== AGENT GENERATORS ===');
  r.rows.forEach(g=>console.log(`  ${g.generator_id}: ${g.generator_name} (${g.generator_type})`));

  // 7. Check agent_swarms without matching swarm_templates  
  console.log('\n=== AGENT SWARMS WITHOUT TEMPLATE MATCH ===');
  r = await p.query(`
    SELECT a.name, a.swarm_type, a.vertical_slug, a.mas_score, a.active_agents
    FROM agent_swarms a
    LEFT JOIN swarm_templates s ON s.name = a.name OR s.key = lower(replace(a.name, ' ', '_')) || '_swarm'
    WHERE s.id IS NULL
    ORDER BY a.name
  `);
  console.log(`  ${r.rows.length} swarms without matching template`);
  r.rows.forEach(s=>console.log(`  ${s.name} | type=${s.swarm_type} | vert=${s.vertical_slug} | mas=${s.mas_score} | agents=${s.active_agents}`));

  await p.end();
})();
