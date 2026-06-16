import pg from 'pg';
const pool = new pg.Pool({
  host: 'db.jebixydqpvsegvrtfmgm.supabase.co',
  port: 5432, database: 'postgres', user: 'postgres',
  password: process.env.SUPABASE_DB_PASSWORD ,
  ssl: { rejectUnauthorized: false },
});

// Check if our agents have MAS scores
const r = await pool.query(`
  SELECT a.agent_id, a.agent_name, 
         e.capability, e.trust, e.synergy, e.activation, e.evolution, e.risk, e.mas
  FROM agents a
  LEFT JOIN evolved_eden_agents e ON a.agent_id = e.agent_id
  WHERE a.agent_name IS NOT NULL
  ORDER BY a.agent_name
  LIMIT 30
`);
console.log('MAS scores for first 30 agents:');
console.table(r.rows);

// Count how many have MAS vs don't
const stats = await pool.query(`
  SELECT 
    COUNT(*) as total,
    COUNT(e.agent_id) FILTER (WHERE e.agent_id IS NOT NULL) as has_mas,
    COUNT(e.agent_id) FILTER (WHERE e.agent_id IS NULL) as no_mas
  FROM agents a
  LEFT JOIN evolved_eden_agents e ON a.agent_id = e.agent_id
`);
console.log('\nCoverage:');
console.table(stats.rows);

// Check what the UI shows - the actual data
const sample = await pool.query(`
  SELECT agent_id, agent_name, capability, trust, synergy, activation, evolution, risk, mas
  FROM evolved_eden_agents
  WHERE agent_id IN ('client_concierge', 'lead_nurture', 'operations_orchestrator', 'marketing_intelligence', 'ai_twin_manager')
`);
console.log('\nSpecific agent rows in evolved_eden_agents:');
console.table(sample.rows);

await pool.end();
