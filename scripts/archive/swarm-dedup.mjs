import pg from 'pg';

const pool = new pg.Pool({
  host: 'db.jebixydqpvsegvrtfmgm.supabase.co', port: 5432, database: 'postgres',
  user: 'postgres', password: process.argv[2],
  ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 15000,
});

async function main() {
  console.log('▓▓▓ STEP 6: AGENT SWARMS DEDUP ▓▓▓\n');

  // Find all duplicate-named swarms
  const {rows: dupSwarms} = await pool.query(`
    SELECT name, array_agg(id::text ORDER BY mas_score DESC NULLS LAST, created_at ASC) as ids,
           array_agg(mas_score::text ORDER BY mas_score DESC NULLS LAST, created_at ASC) as scores
    FROM agent_swarms 
    WHERE name IS NOT NULL AND name != ''
    GROUP BY name
    HAVING count(*) > 1
  `);
  console.log(`Found ${dupSwarms.length} duplicate swarm names to deduplicate`);

  let mergedCount = 0;
  for (const dup of dupSwarms) {
    const ids = dup.ids;
    const scores = dup.scores;
    const keepId = ids[0]; // Best score is first (sorted DESC)
    const deleteIds = ids.slice(1);
    
    // Batch update all swarm_agents to point to the kept swarm
    if (deleteIds.length > 0) {
      // Update swarm_agents
      const update = await pool.query(
        `UPDATE swarm_agents SET swarm_id = $1 WHERE swarm_id = ANY($2::uuid[])`,
        [keepId, deleteIds]
      );
      
      // Delete all duplicates
      const del = await pool.query(
        `DELETE FROM agent_swarms WHERE id = ANY($1::uuid[])`,
        [deleteIds]
      );
      
      mergedCount += deleteIds.length;
      if (dup.name !== 'default_vertical_swarm') {
        console.log(`  Merged ${deleteIds.length} duplicates of "${dup.name}" → kept score=${scores[0]}`);
      }
    }
  }
  console.log(`\n  Total merged: ${mergedCount} duplicates removed`);

  // Now update MAS scores for agent_swarms using computed averages
  console.log('\n▓▓▓ STEP 6b: UPDATE AGENT SWARM MAS SCORES ▓▓▓\n');
  
  const swarmScoreUpdate = await pool.query(`
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
  console.log(`  Updated MAS scores for ${swarmScoreUpdate.rowCount} agent_swarms`);

  // 7. Fix agent_swarm_members scores
  console.log('\n▓▓▓ STEP 7: AGENT SWARM MEMBERS SCORES ▓▓▓\n');
  const memberUpdate = await pool.query(`
    UPDATE agent_swarm_members m
    SET swarm_mas_score = a.mas_score
    FROM agents a
    WHERE m.agent_id = a.id
      AND m.swarm_mas_score IS NULL
      AND a.mas_score IS NOT NULL
  `);
  console.log(`  Updated ${memberUpdate.rowCount} agent_swarm_members scores`);

  // 8. Final verification
  console.log('\n▓▓▓ VERIFICATION ▓▓▓\n');
  const checks = [
    ['swarm_templates_total', "SELECT count(*) as c FROM swarm_templates"],
    ['templates_with_members', "SELECT count(*) as c FROM swarm_templates WHERE member_agents IS NOT NULL AND member_agents != ''"],
    ['swarm_agents_mas_filled', "SELECT count(*) as c FROM swarm_agents WHERE mas_score IS NOT NULL"],
    ['agent_swarms_unique', "SELECT count(*) as c FROM (SELECT name FROM agent_swarms WHERE name IS NOT NULL AND name != '' GROUP BY name HAVING count(*) > 1) dup"],
    ['agent_swarms_avg_mas', "SELECT round(avg(mas_score)::numeric,2) as c FROM agent_swarms WHERE mas_score > 0"],
    ['agent_swarm_members_filled', "SELECT count(*) as c FROM agent_swarm_members WHERE swarm_mas_score IS NOT NULL"],
  ];
  for (const [name, sql] of checks) {
    const r = await pool.query(sql);
    console.log(`  ${name}: ${r.rows[0].c}`);
  }

  await pool.end();
  console.log('\n✅ SWARM DEDUP & SCORE UPDATE COMPLETE');
}

main().catch(e => { console.error('FATAL:', e); process.exit(1); });
