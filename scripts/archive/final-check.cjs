const {Pool}=require('pg');
const p = new Pool({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false }
});
(async()=>{
  // 1. generators table — does anything still reference it?
  console.log('▓▓▓ GENERATORS TABLE STATUS ▓▓▓\n');
  const refs = await p.query(`
    SELECT tc.table_name, kcu.column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY' AND ccu.table_name = 'generators'
  `);
  if (refs.rows.length === 0) console.log('  No FK references to generators table — safe to drop/migrate');
  else refs.forEach(r=>console.log(`  ${r.table_name}.${r.column_name} → generators`));

  // 2. generators with NO matching agent_generators entry
  const missing = await p.query(`
    SELECT g.gen_id, g.generator_name FROM generators g 
    WHERE NOT EXISTS (SELECT 1 FROM agent_generators ag WHERE ag.generator_id = g.gen_id)
  `);
  console.log(`\n  Generators NOT in agent_generators: ${missing.rows.length}`);
  if (missing.rows.length > 0) missing.rows.forEach(g=>console.log(`    ${g.gen_id}: ${g.generator_name}`));

  // 3. agent_generators without matching generator
  const extra = await p.query(`
    SELECT ag.generator_id, ag.generator_name FROM agent_generators ag 
    WHERE NOT EXISTS (SELECT 1 FROM generators g WHERE g.gen_id = ag.generator_id)
  `);
  console.log(`\n  agent_generators NOT in generators: ${extra.rows.length}`);
  if (extra.rows.length > 0) extra.rows.forEach(g=>console.log(`    ${g.generator_id}: ${g.generator_name}`));

  // 4. The agent_generators extra columns (agent_id, name) — what are they?
  const r = await p.query(`
    SELECT column_name, data_type, is_nullable 
    FROM information_schema.columns 
    WHERE table_name='agent_generators' 
    ORDER BY ordinal_position
  `);
  console.log('\n▓▓▓ AGENT GENERATORS FULL SCHEMA ▓▓▓');
  r.rows.forEach(c=>console.log(`  ${c.column_name}: ${c.data_type} nullable=${c.is_nullable}`));

  // 5. Quick check: any views or functions referencing generators?
  const deps = await p.query(`
    SELECT DISTONCT dependent_ns.nspname, dependent_view.relname as view_name
    FROM pg_depend 
    JOIN pg_rewrite ON pg_depend.objid = pg_rewrite.oid
    JOIN pg_class as dependent_view ON pg_rewrite.ev_class = dependent_view.oid
    JOIN pg_class as source_table ON pg_depend.refobjid = source_table.oid
    JOIN pg_namespace source_ns ON source_table.relnamespace = source_ns.oid
    JOIN pg_namespace dependent_ns ON dependent_view.relnamespace = dependent_ns.oid
    WHERE source_table.relname = 'generators'
  `);
  
  // 6. Check n8n connections — do the n8n templates have actual workflow data?
  console.log('\n▓▓▓ n8N WORKFLOW CONNECTIONS ▓▓▓');
  let wf = await p.query("SELECT key, name, workflow_type, stages_json FROM workflow_templates WHERE workflow_type ILIKE '%n8n%' LIMIT 8");
  wf.rows.forEach(w=>{
    const stages = typeof w.stages_json === 'string' ? JSON.parse(w.stages_json || '[]') : (w.stages_json || []);
    console.log(`  ${w.key}: ${w.name} (${stages.length} stages)`);
  });
  
  // Check if n8n templates are connected to agents
  const connected = await p.query(`
    SELECT count(*) as c FROM agent_workflows aw 
    JOIN workflow_templates wt ON aw.workflow_id = wt.id
    WHERE wt.workflow_type ILIKE '%n8n%'
  `);
  console.log(`  Agent-workflow connections for n8n: ${connected.rows[0].c}`);

  await p.end();
})();
