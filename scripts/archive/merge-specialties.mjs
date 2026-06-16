import pg from 'pg';
const pool = new pg.Pool({
  host: 'db.jebixydqpvsegvrtfmgm.supabase.co', port: 5432, database: 'postgres',
  user: 'postgres', password: process.argv[2],
  ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 15000,
});

// Merge vertical_subs into specialties where applicable
// specialties is text[], vertical_subs is also text[]
const {rows: agents} = await pool.query("SELECT id, vertical, vertical_subs, specialties FROM agents");

let merged = 0;
for (const a of agents) {
  const subs = a.vertical_subs || [];
  const specs = a.specialties || [];
  
  if (subs.length > 0 && !specs.some(s => subs.includes(s))) {
    // Add subs into specialties (avoiding dupes)
    const newSpecs = [...new Set([...specs, ...subs])];
    await pool.query("UPDATE agents SET specialties = $1 WHERE id = $2", [newSpecs, a.id]);
    merged++;
  }
}
console.log(`Merged vertical_subs into specialties for ${merged} agents`);

// Verify
const {rows: check} = await pool.query(`
  SELECT 
    count(*)::int as total,
    count(*) FILTER (WHERE specialties IS NOT NULL AND array_length(specialties, 1) > 0)::int as has_specialties,
    count(*) FILTER (WHERE vertical_subs IS NOT NULL AND array_length(vertical_subs, 1) > 0)::int as has_vertical_subs
  FROM agents
`);
console.log(`Results: ${JSON.stringify(check[0])}`);

// Sample check
const {rows: sample} = await pool.query(`
  SELECT agent_name, vertical, vertical_subs, specialties FROM agents 
  WHERE specialties IS NOT NULL AND array_length(specialties, 1) > 0 
  LIMIT 5
`);
for (const s of sample) console.log(`  ${s.agent_name.padEnd(30)} vertical=${(s.vertical||'').padEnd(15)} subs=${(s.vertical_subs||[]).join(',')} specs=${(s.specialties||[]).join(',')}`);

await pool.end();
