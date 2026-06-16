import pg from 'pg';
const pool = new pg.Pool({
  host: 'db.jebixydqpvsegvrtfmgm.supabase.co', port: 5432, database: 'postgres',
  user: 'postgres', password: process.argv[2],
  ssl: { rejectUnauthorized: false },
});

async function main() {
  // 1. Fix remaining empty templates
  console.log('=== FIXING EMPTY TEMPLATES ===\n');
  
  // Fetch all agents for reference
  const {rows: agents} = await pool.query("SELECT id, agent_id, agent_name, vertical, role_type FROM agents WHERE agent_id IS NOT NULL");
  const byVert = {};
  for (const a of agents) {
    const v = a.vertical || 'unassigned';
    if (!byVert[v]) byVert[v] = [];
    byVert[v].push(a);
  }

  // client_retention_swarm — agents with client/retention in name
  const crAgents = agents.filter(a => (a.agent_name||'').toLowerCase().match(/client|retention|loyalty|relation|experience|satisfaction|vip/));
  await pool.query(`UPDATE swarm_templates SET member_agents = $1, name = 'Client Retention Swarm', vertical_key = null WHERE key = 'client_retention_swarm'`,
    [crAgents.map(a=>a.agent_id).join(',')]);
  console.log(`  client_retention_swarm → ${crAgents.length} agents`);

  // luxury_concierge_swarm — luxury vertical agents
  const lxAgents = agents.filter(a => a.vertical === 'luxury');
  await pool.query(`UPDATE swarm_templates SET member_agents = $1, name = 'Luxury Concierge Swarm', vertical_key = 'luxury' WHERE key = 'luxury_concierge_swarm'`,
    [lxAgents.map(a=>a.agent_id).join(',')]);
  console.log(`  luxury_concierge_swarm → ${lxAgents.length} agents`);

  // sales_conversion_swarm — agents with sales/lead/conversion in name
  const scAgents = agents.filter(a => (a.agent_name||'').toLowerCase().match(/sales|lead|acquisition|conversion|outreach|nurture|deal|pipeline/));
  await pool.query(`UPDATE swarm_templates SET member_agents = $1, name = 'Sales Conversion Swarm', vertical_key = null WHERE key = 'sales_conversion_swarm'`,
    [scAgents.map(a=>a.agent_id).join(',')]);
  console.log(`  sales_conversion_swarm → ${scAgents.length} agents`);

  // sales_enterprise_swarm — already created by script but with 0 agents. Let's fix.
  const seAgents = agents.filter(a => (a.agent_name||'').toLowerCase().match(/enterprise|corporate.*sales|b2b|account.*exec|revenue.*growth/));
  await pool.query(`UPDATE swarm_templates SET member_agents = $1, name = 'Enterprise Sales Swarm', vertical_key = 'corporate' WHERE key = 'sales_enterprise_swarm'`,
    [seAgents.map(a=>a.agent_id).join(',')]);
  console.log(`  sales_enterprise_swarm → ${seAgents.length} agents`);

  // 2. Case-insensitive dedup of agent_swarms
  console.log('\n=== CASE-INSENSITIVE SWARM DEDUP ===\n');
  
  // Group by lower(name) to find case duplicates
  const {rows: caseDups} = await pool.query(`
    SELECT lower(name) as lname, 
           array_agg(id::text ORDER BY mas_score DESC NULLS LAST) as ids,
           array_agg(name ORDER BY mas_score DESC NULLS LAST) as names
    FROM agent_swarms 
    WHERE name IS NOT NULL AND name != '' AND lower(name) != 'default_vertical_swarm'
    GROUP BY lower(name)
    HAVING count(*) > 1
  `);
  
  let merged = 0;
  for (const dup of caseDups) {
    const ids = dup.ids;
    const names = dup.names;
    const keepId = ids[0]; // best score
    const deleteIds = ids.slice(1);
    
    if (deleteIds.length > 0) {
      await pool.query(`UPDATE swarm_agents SET swarm_id = $1 WHERE swarm_id = ANY($2::uuid[])`, [keepId, deleteIds]);
      await pool.query(`DELETE FROM agent_swarms WHERE id = ANY($1::uuid[])`, [deleteIds]);
      merged += deleteIds.length;
      console.log(`  Merged "${names[1]}" → "${names[0]}" (kept)`);
    }
  }
  console.log(`  Total case-insensitive merges: ${merged}`);

  // 3. Remove default_vertical_swarm duplicates (many of them)
  console.log('\n=== CLEANING default_vertical_swarm ===\n');
  const {rows: defDups} = await pool.query(`
    SELECT id, name, mas_score FROM agent_swarms 
    WHERE name = 'default_vertical_swarm' 
    ORDER BY mas_score DESC NULLS LAST
  `);
  if (defDups.length > 1) {
    const keepId = defDups[0].id;
    const deleteIds = defDups.slice(1).map(r => r.id);
    await pool.query(`UPDATE swarm_agents SET swarm_id = $1 WHERE swarm_id = ANY($2::uuid[])`, [keepId, deleteIds]);
    await pool.query(`DELETE FROM agent_swarms WHERE id = ANY($1::uuid[])`, [deleteIds]);
    console.log(`  Merged ${deleteIds.length} default_vertical_swarm duplicates`);
  }

  // 4. Final counts
  console.log('\n=== FINAL COUNTS ===\n');
  let r = await pool.query("SELECT count(*) as c FROM swarm_templates WHERE member_agents IS NOT NULL AND member_agents != ''");
  console.log(`  Templates with members: ${r.rows[0].c}`);
  r = await pool.query("SELECT count(*) as c FROM swarm_templates");
  console.log(`  Total templates: ${r.rows[0].c}`);
  r = await pool.query("SELECT count(*) as c FROM agent_swarms");
  console.log(`  Total agent_swarms: ${r.rows[0].c}`);
  r = await pool.query("SELECT count(*) as c FROM swarm_agents WHERE mas_score IS NOT NULL");
  console.log(`  swarm_agents with MAS: ${r.rows[0].c}`);
  
  await pool.end();
  console.log('\n✅ FINAL SWARM CLEANUP COMPLETE');
}

main().catch(e => { console.error('FATAL:', e); process.exit(1); });
