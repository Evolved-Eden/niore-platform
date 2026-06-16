const {Pool}=require('pg');
const p = new Pool({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false }
});
(async()=>{
  // 1. Check which columns exist on agents for referencing
  console.log('=== AGENT REFERENCE COLUMNS ===');
  let r=await p.query("SELECT column_name FROM information_schema.columns WHERE table_name='agents' AND (column_name LIKE '%agent_id%' OR column_name LIKE '%key%' OR column_name LIKE '%slug%')");
  console.log('Agent-reference columns:', r.rows.map(c=>c.column_name).join(', '));
  
  r=await p.query("SELECT agent_id, agent_name, vertical, role_type, slug, archetype_id FROM agents LIMIT 10");
  console.log('\nSample agents with IDs:');
  r.rows.forEach(a=>console.log(`  agent_id=${a.agent_id} name=${a.agent_name} vertical=${a.vertical} role=${a.role_type} slug=${a.slug} archetype=${a.archetype_id}`));

  // 2. Check swarm_templates - what templates exist and what vertical_key they have
  console.log('\n=== SWARM TEMPLATES DETAIL ===');
  r=await p.query("SELECT key, name, swarm_name, vertical_key, description, member_agents, template_type FROM swarm_templates ORDER BY key");
  r.rows.forEach(s=>console.log(`  ${s.key} | name=${s.name||s.swarm_name} | vert=${s.vertical_key} | type=${s.template_type} | members=${s.member_agents||'(empty)'}`));

  // 3. Check agents by vertical for MAS score distribution
  console.log('\n=== AGENTS BY VERTICAL ===');
  r=await p.query("SELECT vertical, count(*) as cnt, round(avg(mas_score)::numeric,2) as avg_mas FROM agents GROUP BY vertical ORDER BY cnt DESC");
  r.rows.forEach(v=>console.log(`  ${v.vertical||'(null)'}: ${v.cnt} agents, avg MAS = ${v.avg_mas}`));

  // 4. Check agent roles and their counts
  console.log('\n=== AGENTS BY ROLE TYPE ===');
  r=await p.query("SELECT role_type, count(*) as cnt, round(avg(mas_score)::numeric,2) as avg_mas FROM agents GROUP BY role_type ORDER BY cnt DESC");
  r.rows.forEach(v=>console.log(`  ${v.role_type}: ${v.cnt} agents, avg MAS = ${v.avg_mas}`));

  // 5. Check how many swarm_agents have null mas_score
  console.log('\n=== SWARM_AGENTS MAS SCORES ===');
  r=await p.query("SELECT count(*) as total, sum(CASE WHEN mas_score IS NULL THEN 1 ELSE 0 END) as null_scores FROM swarm_agents");
  console.log(`  Total: ${r.rows[0].total}, Null MAS scores: ${r.rows[0].null_scores}`);

  // 6. Count agent_swarms by type
  console.log('\n=== AGENT_SWARMS BY TYPE ===');
  r=await p.query("SELECT swarm_type, count(*) as cnt, round(avg(mas_score)::numeric,2) as avg_mas FROM agent_swarms GROUP BY swarm_type ORDER BY cnt DESC");
  r.rows.forEach(v=>console.log(`  ${v.swarm_type}: ${v.cnt} swarms, avg MAS = ${v.avg_mas}`));

  // 7. Check swarm_agents for duplicate agent_id - one agent could be in multiple swarms
  console.log('\n=== SWARM_AGENTS DUPLICATE AGENTS ===');
  r=await p.query("SELECT sa.agent_id, a.agent_name, count(*) as swarm_count FROM swarm_agents sa LEFT JOIN agents a ON sa.agent_id=a.id GROUP BY sa.agent_id, a.agent_name HAVING count(*) > 1 ORDER BY swarm_count DESC LIMIT 20");
  console.log(`  Agents in multiple swarms:`);
  r.rows.forEach(v=>console.log(`  agent=${v.agent_name||v.agent_id} | in ${v.swarm_count} swarms`));

  // 8. Check relationship: swarm_agents.swarm_id -> agent_swarms.id
  console.log('\n=== SWARM_AGENTS -> AGENT_SWARMS ===');
  r=await p.query("SELECT sa.swarm_id, as2.name as swarm_name, count(*) as agent_count FROM swarm_agents sa LEFT JOIN agent_swarms as2 ON sa.swarm_id=as2.id GROUP BY sa.swarm_id, as2.name ORDER BY agent_count DESC LIMIT 20");
  r.rows.forEach(v=>console.log(`  swarm_id=${v.swarm_id} | name=${v.swarm_name} | agents=${v.agent_count}`));

  await p.end();
})();
