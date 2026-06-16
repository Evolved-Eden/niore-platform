import pg from 'pg';
const pool = new pg.Pool({
  host: 'db.jebixydqpvsegvrtfmgm.supabase.co', port: 5432, database: 'postgres',
  user: 'postgres', password: process.argv[2],
  ssl: { rejectUnauthorized: false },
});

async function main() {
  // 1. Templates without members
  console.log('=== Templates WITHOUT member_agents ===');
  let r = await pool.query("SELECT key, name FROM swarm_templates WHERE (member_agents IS NULL OR member_agents = '') ORDER BY key");
  r.rows.forEach(t => console.log(`  ${t.key} — ${t.name}`));

  // 2. API check — test the swarm endpoint directly
  console.log('\n=== API SIMULATION (GET /api/admin/swarms) ===');
  r = await pool.query("SELECT count(*) as c FROM swarm_templates");
  console.log(`  Total templates: ${r.rows[0].c}`);
  
  r = await pool.query("SELECT count(*) as c FROM swarm_templates WHERE is_active = true");
  console.log(`  Active templates: ${r.rows[0].c}`);
  
  // 3. Check a sample template
  console.log('\n=== Sample swarm_templates (first 10) ===');
  r = await pool.query("SELECT key, name, vertical_key, template_type, length(coalesce(member_agents,'')) as members_len FROM swarm_templates ORDER BY key LIMIT 10");
  r.rows.forEach(t => console.log(`  ${t.key} | ${t.name} | vert=${t.vertical_key||'-'} | type=${t.template_type||'-'} | members=${t.members_len} chars`));

  // 4. Agent_swarms summary
  console.log('\n=== Agent Swarms Summary ===');
  r = await pool.query("SELECT count(*) as total FROM agent_swarms");
  console.log(`  Total unique swarms: ${r.rows[0].total}`);
  r = await pool.query("SELECT swarm_type, count(*) as cnt, round(avg(mas_score)::numeric,2) as avg_mas, round(avg(active_agents)::numeric,1) as avg_agents FROM agent_swarms GROUP BY swarm_type ORDER BY cnt DESC");
  r.rows.forEach(s => console.log(`  ${s.swarm_type}: ${s.cnt} swarms, avg MAS=${s.avg_mas}, avg agents=${s.avg_agents}`));

  // 5. Top swarms by MAS
  console.log('\n=== Top 10 Agent Swarms by MAS Score ===');
  r = await pool.query("SELECT name, mas_score, active_agents, mas_state FROM agent_swarms WHERE mas_score > 0 ORDER BY mas_score DESC LIMIT 10");
  r.rows.forEach(s => console.log(`  ${s.name}: MAS=${s.mas_score}, agents=${s.active_agents}, state=${s.mas_state}`));

  await pool.end();
}
main().catch(e => { console.error(e); process.exit(1); });
