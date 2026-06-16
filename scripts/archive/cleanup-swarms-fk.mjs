import pg from 'pg';
const pool = new pg.Pool({
  host: 'db.jebixydqpvsegvrtfmgm.supabase.co', port: 5432, database: 'postgres',
  user: 'postgres', password: process.argv[2],
  ssl: { rejectUnauthorized: false },
});

async function main() {
  console.log('=== CLEANING NON-VERTICAL SWARMS (with FK handling) ===\n');

  // 1. Delete dependent records first
  const delSnapshots = await pool.query(`
    DELETE FROM swarm_mas_snapshots 
    WHERE swarm_id IN (SELECT id FROM agent_swarms WHERE swarm_type IS DISTINCT FROM 'vertical')
  `);
  console.log(`Deleted ${delSnapshots.rowCount} swarm_mas_snapshots`);

  // 2. Delete swarm_agents links for non-vertical swarms after reassigning to vertical
  const {rows: toDelete} = await pool.query(`
    SELECT id, name, swarm_type FROM agent_swarms 
    WHERE swarm_type IS DISTINCT FROM 'vertical'
    ORDER BY name
  `);

  const {rows: keepSwarms} = await pool.query(`
    SELECT id, name FROM agent_swarms WHERE swarm_type = 'vertical'
  `);

  let reassigned = 0;
  for (const del of toDelete) {
    const baseName = del.name.toLowerCase().replace(/\s+/g, '_').replace(/_swarm$/, '');
    const matchVert = keepSwarms.find(s => s.name === `${baseName}_swarm`);
    if (matchVert) {
      await pool.query('UPDATE swarm_agents SET swarm_id = $1 WHERE swarm_id = $2', [matchVert.id, del.id]);
      reassigned++;
    }
  }
  console.log(`Reassigned ${reassigned} swarm_agent groups`);

  // 3. Now delete non-vertical swarms
  const delSwarms = await pool.query(`
    DELETE FROM agent_swarms WHERE swarm_type IS DISTINCT FROM 'vertical'
  `);
  console.log(`Deleted ${delSwarms.rowCount} non-vertical agent_swarms`);

  // 4. Update MAS scores
  await pool.query(`
    UPDATE agent_swarms a
    SET mas_score = sub.avg_score,
        active_agents = sub.agent_count,
        mas_state = CASE 
          WHEN sub.avg_score >= 85 THEN 'high_performance'
          WHEN sub.avg_score >= 70 THEN 'stable'
          WHEN sub.avg_score >= 55 THEN 'monitor'
          ELSE 'degraded'
        END
    FROM (
      SELECT sa.swarm_id, 
             round(avg(coalesce(sa.mas_score, a2.mas_score, 0))::numeric, 4) as avg_score,
             count(*)::int as agent_count
      FROM swarm_agents sa
      LEFT JOIN agents a2 ON sa.agent_id = a2.id
      GROUP BY sa.swarm_id
    ) sub
    WHERE a.id = sub.swarm_id
  `);
  console.log('Updated MAS scores');

  // 5. Final count
  const cnt = await pool.query('SELECT count(*) as c FROM agent_swarms');
  console.log(`\nAgent swarms remaining: ${cnt.rows[0].c}`);

  await pool.end();
  console.log('✅ Done');
}

main().catch(e => { console.error('FATAL:', e); process.exit(1); });
