const {Pool} = require('pg');
const p = new Pool({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false }
});
(async()=>{
  // Sample 5 agents full data
  const r1 = await p.query("SELECT agent_id, agent_name, vertical, role_type, agent_type, orchestration_mode, tagline, description, icon, avatar_id, decision_mode, autonomy_level, authority_level, risk_level, evolution_status, mas_score, mas_category, tools, connectors, is_platform, is_system_agent FROM agents ORDER BY agent_id LIMIT 10");
  console.log('=== SAMPLE AGENTS (10) ===');
  for (const row of r1.rows) {
    console.log(`\n${row.agent_id} | ${row.agent_name}`);
    console.log(`  vertical=${row.vertical} role=${row.role_type} type=${row.agent_type} mode=${row.orchestration_mode}`);
    console.log(`  decision=${row.decision_mode} auth=${row.authority_level} risk=${row.risk_level}`);
    console.log(`  evo=${row.evolution_status} mas=${row.mas_score} cat=${row.mas_category}`);
    console.log(`  avatar=${row.avatar_id} platform=${row.is_platform} system=${row.is_system_agent}`);
    console.log(`  tagline: ${row.tagline?.substring(0,60)}`);
    console.log(`  tools: ${row.tools?.substring(0,60)}`);
  }

  // Check agents by agent_type distribution
  const r2 = await p.query('SELECT agent_type, COUNT(*) as count FROM agents GROUP BY agent_type ORDER BY COUNT(*) DESC');
  console.log('\n=== AGENTS BY TYPE ===');
  console.table(r2.rows);

  // Check orchestration mode distribution
  const r3 = await p.query('SELECT orchestration_mode, COUNT(*) as count FROM agents GROUP BY orchestration_mode ORDER BY COUNT(*) DESC');
  console.log('\n=== ORCHESTRATION MODES ===');
  console.table(r3.rows);

  // Decision mode distribution
  const r4 = await p.query('SELECT decision_mode, COUNT(*) as count FROM agents GROUP BY decision_mode ORDER BY COUNT(*) DESC');
  console.log('\n=== DECISION MODES ===');
  console.table(r4.rows);

  // MAS category distribution
  const r5 = await p.query('SELECT mas_category, COUNT(*) as count FROM agents GROUP BY mas_category ORDER BY COUNT(*) DESC');
  console.log('\n=== MAS CATEGORIES ===');
  console.table(r5.rows);

  // Evolution status distribution
  const r6 = await p.query('SELECT evolution_status, COUNT(*) as count FROM agents GROUP BY evolution_status ORDER BY COUNT(*) DESC');
  console.log('\n=== EVOLUTION STATUS ===');
  console.table(r6.rows);

  // Swarms created
  const r7 = await p.query('SELECT swarm_name, swarm_slug FROM agent_swarms ORDER BY swarm_name');
  console.log('\n=== SWARMS ===');
  console.table(r7.rows);

  // Swarm agents count
  const r8 = await p.query('SELECT s.swarm_name, COUNT(sa.id) as members FROM agent_swarms s LEFT JOIN swarm_agents sa ON s.id = sa.swarm_id GROUP BY s.swarm_name, s.id ORDER BY s.swarm_name');
  console.log('\n=== SWARM MEMBERS ===');
  console.table(r8.rows);

  // Check nulls in critical fields
  const r9 = await p.query(`
    SELECT 
      SUM(CASE WHEN agent_type IS NULL THEN 1 ELSE 0 END) as null_type,
      SUM(CASE WHEN description IS NULL THEN 1 ELSE 0 END) as null_desc,
      SUM(CASE WHEN tagline IS NULL THEN 1 ELSE 0 END) as null_tagline,
      SUM(CASE WHEN avatar_id IS NULL THEN 1 ELSE 0 END) as null_avatar,
      SUM(CASE WHEN mas_score IS NULL THEN 1 ELSE 0 END) as null_mas,
      SUM(CASE WHEN orchestration_mode IS NULL THEN 1 ELSE 0 END) as null_mode,
      SUM(CASE WHEN decision_mode IS NULL THEN 1 ELSE 0 END) as null_decision,
      SUM(CASE WHEN autonomy_level IS NULL THEN 1 ELSE 0 END) as null_autonomy,
      SUM(CASE WHEN icon IS NULL OR icon = '{}' THEN 1 ELSE 0 END) as null_icon,
      SUM(CASE WHEN capabilities IS NULL OR capabilities = '[]'::jsonb THEN 1 ELSE 0 END) as null_caps,
      SUM(CASE WHEN specialties IS NULL OR specialties = '{}' THEN 1 ELSE 0 END) as null_specs
    FROM agents
  `);
  console.log('\n=== NULL COUNTS ===');
  console.table(r9.rows);

  await p.end();
})();
