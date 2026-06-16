import pg from 'pg';
const pool = new pg.Pool({
  host: 'db.jebixydqpvsegvrtfmgm.supabase.co', port: 5432, database: 'postgres',
  user: 'postgres', password: process.argv[2],
  ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 15000,
});

// agent_swarm_members uses agent_swarm_id (points to agent_swarms.id)
// swarm_agents uses swarm_id (points to agent_swarms.id)
// They're the same FK, just different column names.
// Also deduplicate since sample data shows duplicates

// First, deduplicate swarm_agents (keep lowest id for each swarm_id+agent_id combo)
console.log('Deduplicating swarm_agents...');
// Dedup: keep the row with the earliest created_at for each (swarm_id, agent_id) pair
const {rowCount: delDups} = await pool.query(`
  DELETE FROM swarm_agents WHERE id IN (
    SELECT id FROM (
      SELECT id, ROW_NUMBER() OVER (PARTITION BY swarm_id, agent_id ORDER BY created_at ASC, id::text ASC) as rn
      FROM swarm_agents
    ) sub WHERE rn > 1
  )
`);
console.log(`Deleted ${delDups || 0} duplicate swarm_agent rows`);

// Now copy swarm_agents → agent_swarm_members
// Map: swarm_id → agent_swarm_id, copy role, execution_order, can_delegate, created_at, mas_score
console.log('\nPopulating agent_swarm_members from swarm_agents...');
const {rowCount} = await pool.query(`
  INSERT INTO agent_swarm_members (agent_swarm_id, agent_id, role, execution_order, can_delegate, created_at, swarm_mas_score)
  SELECT sa.swarm_id, sa.agent_id, sa.role, sa.execution_order, sa.can_delegate, sa.created_at, sa.mas_score
  FROM swarm_agents sa
  ON CONFLICT DO NOTHING
`);
console.log(`Inserted ${rowCount} rows into agent_swarm_members`);

// Verify
const {rows: check} = await pool.query("SELECT COUNT(*)::int as c FROM agent_swarm_members");
console.log(`\nagent_swarm_members count: ${check[0].c}`);

// Sample
const {rows: sample} = await pool.query(`
  SELECT as2.name, asm.agent_id, asm.role, asm.swarm_mas_score
  FROM agent_swarm_members asm
  JOIN agent_swarms as2 ON as2.id = asm.agent_swarm_id
  LIMIT 5
`);
console.log('Sample:', JSON.stringify(sample, null, 2));

await pool.end();
