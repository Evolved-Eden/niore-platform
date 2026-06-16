import pg from 'pg';
const pool = new pg.Pool({
  host: 'db.jebixydqpvsegvrtfmgm.supabase.co', port: 5432, database: 'postgres',
  user: 'postgres', password: process.argv[2],
  ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 15000,
});

// Copy swarm_agents → agent_swarm_members
// First check what columns agent_swarm_members has
const {rows: cols} = await pool.query(
  "SELECT column_name, data_type FROM information_schema.columns WHERE table_name='agent_swarm_members' ORDER BY ordinal_position"
);
console.log('agent_swarm_members columns:');
console.log(cols.map(c => `  ${c.column_name} (${c.data_type})`).join('\n'));

// Check swarm_agents columns  
const {rows: saCols} = await pool.query(
  "SELECT column_name, data_type FROM information_schema.columns WHERE table_name='swarm_agents' ORDER BY ordinal_position"
);
console.log('\nswarm_agents columns:');
console.log(saCols.map(c => `  ${c.column_name} (${c.data_type})`).join('\n'));

// Check sample data from both
const {rows: sa} = await pool.query("SELECT * FROM swarm_agents LIMIT 3");
console.log('\nswarm_agents sample:', JSON.stringify(sa, null, 2));

// Check if swarm_agents has a swarm_id that links to agent_swarms
const {rows: swarms} = await pool.query("SELECT id, name, swarm_name FROM agent_swarms LIMIT 3");
console.log('agent_swarms sample:', JSON.stringify(swarms, null, 2));

// Now insert into agent_swarm_members from swarm_agents
// Map based on what columns exist
const asmCols = cols.map(c => c.column_name);
const saColNames = saCols.map(c => c.column_name);

console.log('\nagent_swarm_members columns:', asmCols);
console.log('swarm_agents columns:', saColNames);

// Try to INSERT into agent_swarm_members based on available columns
// Common columns: swarm_id, agent_id, created_at
if (asmCols.includes('swarm_id') && asmCols.includes('agent_id') && saColNames.includes('swarm_id') && saColNames.includes('agent_id')) {
  const {rowCount} = await pool.query(`
    INSERT INTO agent_swarm_members (swarm_id, agent_id, created_at)
    SELECT s.id, sa.agent_id, COALESCE(sa.created_at, now())
    FROM swarm_agents sa
    JOIN agent_swarms s ON s.id = sa.swarm_id
    ON CONFLICT DO NOTHING
  `);
  console.log(`\n✅ Inserted ${rowCount} rows into agent_swarm_members`);
} else {
  console.log('\n❌ Column mismatch — need manual mapping');
  console.log(`agent_swarm_members has: ${asmCols.join(', ')}`);
  console.log(`swarm_agents has: ${saColNames.join(', ')}`);
}

// Verify
const {rows: check} = await pool.query("SELECT COUNT(*)::int as c FROM agent_swarm_members");
console.log(`agent_swarm_members count: ${check[0].c}`);

await pool.end();
