import pg from 'pg';
const pool = new pg.Pool({
  host: 'db.jebixydqpvsegvrtfmgm.supabase.co', port: 5432, database: 'postgres',
  user: 'postgres', password: process.argv[2],
  ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 15000,
});

const tables = ['agents', 'agent_capabilities', 'agent_swarms', 'swarm_templates'];
for (const table of tables) {
  const {rows} = await pool.query(
    "SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_name=$1 ORDER BY ordinal_position",
    [table]
  );
  console.log(`\n=== ${table} ===`);
  for (const r of rows) {
    console.log(`  ${r.column_name.padEnd(30)} ${r.data_type.padEnd(20)} nullable=${r.is_nullable} default=${r.column_default || '-'}`);
  }
  // Check PK
  const {rows: pk} = await pool.query(`
    SELECT a.attname FROM pg_index i 
    JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
    WHERE i.indrelid = $1::regclass AND i.indisprimary
  `, [table]);
  console.log(`  PK: ${pk.map(p=>p.attname).join(', ')}`);
}

// Check sample data
const {rows: agents} = await pool.query("SELECT id, agent_id, agent_name, agent_type, vertical FROM agents LIMIT 3");
console.log('\n=== Sample agents ===');
console.log(JSON.stringify(agents, null, 2));

// Check agent_capabilities sample
const {rows: caps} = await pool.query("SELECT * FROM agent_capabilities LIMIT 5");
console.log('\n=== Sample agent_capabilities ===');
console.log(JSON.stringify(caps, null, 2));

await pool.end();
