const {Pool}=require('pg');
const p = new Pool({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false }
});
(async()=>{
  // 1. swarm_agents
  console.log('=== SWARM_AGENTS ===');
  let r=await p.query("SELECT column_name,data_type FROM information_schema.columns WHERE table_name='swarm_agents' ORDER BY ordinal_position");
  console.log('Columns:');
  r.rows.forEach(c=>console.log(`  ${c.column_name}: ${c.data_type}`));
  r=await p.query("SELECT count(*) as cnt FROM swarm_agents");
  console.log(`Rows: ${r.rows[0].cnt}`);
  if(r.rows[0].cnt>0){
    r=await p.query("SELECT * FROM swarm_agents LIMIT 10");
    console.log('Sample:');
    r.rows.forEach(row=>console.log(' ', JSON.stringify(row)));
  }

  // 2. swarm_templates
  console.log('\n=== SWARM_TEMPLATES ===');
  r=await p.query("SELECT count(*) as cnt FROM swarm_templates");
  console.log(`Rows: ${r.rows[0].cnt}`);
  if(r.rows[0].cnt>0){
    r=await p.query("SELECT * FROM swarm_templates LIMIT 20");
    r.rows.forEach(row=>console.log(`  ${row.key||row.swarm_key} | ${row.name||row.swarm_name} | type=${row.template_type} | agents=${row.member_agents}`));
  }

  // 3. agent_swarms
  console.log('\n=== AGENT_SWARMS ===');
  r=await p.query("SELECT count(*) as cnt FROM agent_swarms");
  console.log(`Rows: ${r.rows[0].cnt}`);
  if(r.rows[0].cnt>0){
    r=await p.query("SELECT id, name, swarm_name, swarm_type, vertical_slug, sub_vertical_slug, mas_score, mas_state, active_agents, orchestration_strategy FROM agent_swarms LIMIT 20");
    r.rows.forEach(row=>console.log(`  ${row.name||row.swarm_name} | type=${row.swarm_type} | vertical=${row.vertical_slug} | mas=${row.mas_score} | state=${row.mas_state} | agents=${row.active_agents} | strategy=${row.orchestration_strategy}`));
  }

  // 4. agent_swarm_members
  console.log('\n=== AGENT_SWARM_MEMBERS ===');
  r=await p.query("SELECT column_name,data_type FROM information_schema.columns WHERE table_name='agent_swarm_members' ORDER BY ordinal_position");
  console.log('Columns:');
  r.rows.forEach(c=>console.log(`  ${c.column_name}: ${c.data_type}`));
  r=await p.query("SELECT count(*) as cnt FROM agent_swarm_members");
  console.log(`Rows: ${r.rows[0].cnt}`);
  if(r.rows[0].cnt>0){
    r=await p.query("SELECT * FROM agent_swarm_members LIMIT 10");
    r.rows.forEach(row=>console.log(' ', JSON.stringify(row)));
  }

  // 5. Agents MAS scores
  console.log('\n=== AGENTS MAS SCORES ===');
  r=await p.query("SELECT agent_name, role_type, mas_score, mas_state, mas_category, mas_priority, health_status FROM agents ORDER BY mas_score DESC NULLS LAST LIMIT 30");
  r.rows.forEach(row=>console.log(`  ${row.agent_name?.substring(0,40)} | type=${row.role_type} | score=${row.mas_score} | state=${row.mas_state} | cat=${row.mas_category} | pri=${row.mas_priority} | health=${row.health_status}`));
  r=await p.query("SELECT count(*) as with_score FROM agents WHERE mas_score IS NOT NULL");
  console.log(`\nAgents with MAS score: ${r.rows[0].cnt}`);
  r=await p.query("SELECT count(*) as total FROM agents");
  console.log(`Total agents: ${r.rows[0].cnt}`);

  // 6. Agent swarm_template_id population
  console.log('\n=== AGENTS swarm_template_id ===');
  r=await p.query("SELECT count(*) as cnt FROM agents WHERE swarm_template_id IS NOT NULL");
  console.log(`Agents with swarm_template_id: ${r.rows[0].cnt}`);

  // 7. Check all tables that link agents to swarms
  console.log('\n=== canonical_swarm_composition ===');
  r=await p.query("SELECT column_name,data_type FROM information_schema.columns WHERE table_name='canonical_swarm_composition' ORDER BY ordinal_position");
  console.log('Columns:');
  r.rows.forEach(c=>console.log(`  ${c.column_name}: ${c.data_type}`));
  r=await p.query("SELECT count(*) as cnt FROM canonical_swarm_composition");
  console.log(`Rows: ${r.rows[0].cnt}`);

  // 8. Check swarm_executions
  console.log('\n=== SWARM_EXECUTIONS ===');
  r=await p.query("SELECT count(*) as cnt FROM swarm_executions");
  console.log(`Rows: ${r.rows[0].cnt}`);

  await p.end();
})();
