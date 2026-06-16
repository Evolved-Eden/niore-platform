import pg from 'pg';
const pool = new pg.Pool({
  host: 'db.jebixydqpvsegvrtfmgm.supabase.co', port: 5432, database: 'postgres',
  user: 'postgres', password: process.argv[2],
  ssl: { rejectUnauthorized: false },
});

async function main() {
  // Fix swarms_json (text[] type)
  const r1 = await pool.query("UPDATE workflow_templates SET swarms_json = '{}'::text[] WHERE swarms_json IS NULL");
  console.log(`workflow_templates.swarms_json: ${r1.rowCount} filled`);

  // Fill swarm_templates remaining NULLs
  const r2 = await pool.query(`
    UPDATE swarm_templates SET
      swarm_key = COALESCE(swarm_key, key),
      swarm_name = COALESCE(swarm_name, name),
      is_active = COALESCE(is_active, true),
      is_system = COALESCE(is_system, false),
      tags = COALESCE(tags, ''),
      metadata = COALESCE(metadata, '{}'::jsonb),
      template_json = COALESCE(template_json, '{}'::jsonb),
      version = COALESCE(version, '1.0')
    WHERE swarm_key IS NULL OR swarm_name IS NULL
  `);
  console.log(`swarm_templates: ${r2.rowCount} updated`);

  // Swap general_type swarms that have total agents count wrong — they got merged
  console.log('\n=== VERIFICATION ===');
  const checks = [
    ['agent_generators', 'SELECT count(*) as c FROM agent_generators'],
    ['agent_swarms', 'SELECT count(*) as c FROM agent_swarms'],
    ['swarm_templates', 'SELECT count(*) as c FROM swarm_templates'],
    ['agents.org_id', "SELECT count(*) as c FROM agents WHERE organization_id IS NOT NULL"],
    ['agents.mas_priority', "SELECT count(*) as c FROM agents WHERE mas_priority IS NOT NULL"],
    ['agents.outputs', "SELECT count(*) as c FROM agents WHERE outputs IS NOT NULL"],
    ['agent_types.cat', "SELECT count(*) as c FROM agent_types WHERE category IS NOT NULL"],
    ['wf.swarms_json', "SELECT count(*) as c FROM workflow_templates WHERE swarms_json IS NOT NULL"],
    ['st.swarm_key', "SELECT count(*) as c FROM swarm_templates WHERE swarm_key IS NOT NULL"],
  ];
  for (const [name, sql] of checks) {
    const r = await pool.query(sql);
    console.log(`  ${name}: ${r.rows[0].c}`);
  }

  await pool.end();
  console.log('\n✅ ALL FIXES COMPLETE');
}

main().catch(e => { console.error('FATAL:', e); process.exit(1); });
