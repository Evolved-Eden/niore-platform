const {Pool}=require('pg');
const p = new Pool({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false }
});
(async()=>{
  // PART 2: Foreign Keys
  console.log('▓▓▓ FOREIGN KEY MAP ▓▓▓\n');
  const fks = await p.query(`
    SELECT tc.table_name, kcu.column_name, ccu.table_name AS ref_table, ccu.column_name AS ref_column
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public'
    ORDER BY tc.table_name, kcu.column_name
  `);
  if (fks.rows.length === 0) console.log('  (NO database-level FK constraints — using application-level relationships)');
  else fks.rows.forEach(f=>console.log(`  ${f.table_name}.${f.column_name} → ${f.ref_table}.${f.ref_column}`));

  // PART 3: Empty tables
  console.log('\n▓▓▓ EMPTY TABLES ▓▓▓\n');
  const tables = await p.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE' ORDER BY table_name");
  let empty = [];
  for (const t of tables.rows) {
    const r = await p.query(`SELECT count(*) as c FROM "${t.table_name}"`);
    if (r.rows[0].c === 0) empty.push(t.table_name);
  }
  if (empty.length === 0) console.log('  None');
  else empty.forEach(t=>console.log(`  ${t}`));

  // PART 4: org_id naming
  console.log('\n▓▓▓ "org_id" (NOT organization_id) COLUMNS ▓▓▓\n');
  const orgCols = await p.query("SELECT table_name, column_name FROM information_schema.columns WHERE table_schema='public' AND column_name LIKE '%org\\_%id%' AND column_name != 'organization_id' ORDER BY table_name");
  if (orgCols.rows.length === 0) console.log('  None found — convention is consistent');
  else orgCols.forEach(c=>console.log(`  ${c.table_name}.${c.column_name}`));

  // PART 7: n8n status
  console.log('\n▓▓▓ n8n WORKFLOW STATUS ▓▓▓\n');
  let r = await p.query("SELECT count(*) as c FROM workflow_templates WHERE workflow_type ILIKE '%n8n%'");
  console.log(`  n8n workflow templates: ${r.rows[0].c}`);
  if (r.rows[0].c > 0) {
    r = await p.query("SELECT key, name, workflow_type FROM workflow_templates WHERE workflow_type ILIKE '%n8n%'");
    r.rows.forEach(w=>console.log(`    ${w.key}: ${w.name} (${w.workflow_type})`));
  }

  // PART 8: org_id coverage
  console.log('\n▓▓▓ organization_id COVERAGE ▓▓▓\n');
  const orgTables = await p.query("SELECT table_name FROM information_schema.columns WHERE table_schema='public' AND column_name='organization_id' ORDER BY table_name");
  for (const t of orgTables.rows) {
    const tot = await p.query(`SELECT count(*) as c FROM "${t.table_name}"`);
    if (tot.rows[0].c === 0) { console.log(`  ${t.table_name}: empty`); continue; }
    const filled = await p.query(`SELECT count(*) as c FROM "${t.table_name}" WHERE organization_id IS NOT NULL`);
    const pct = Math.round(filled.rows[0].c/tot.rows[0].c*1000)/10;
    console.log(`  ${t.table_name}: ${filled.rows[0].c}/${tot.rows[0].c} (${pct}%)`);
  }

  // PART 9: Health
  console.log('\n▓▓▓ AGENT HEALTH ▓▓▓\n');
  r = await p.query("SELECT health_status, count(*) as c FROM agents GROUP BY health_status ORDER BY c DESC");
  r.rows.forEach(h=>console.log(`  health_status ${h.health_status}: ${h.c}`));
  r = await p.query("SELECT operational_state, count(*) as c FROM agents GROUP BY operational_state ORDER BY c DESC");
  r.rows.forEach(s=>console.log(`  operational_state ${s.operational_state}: ${s.c}`));
  r = await p.query("SELECT config_state, count(*) as c FROM agents GROUP BY config_state ORDER BY c DESC");
  r.rows.forEach(c=>console.log(`  config_state ${c.config_state}: ${c.c}`));

  // BONUS: agent_tools tool_key nulls
  console.log('\n▓▓▓ AGENT TOOLS DETAIL ▓▓▓\n');
  r = await p.query("SELECT * FROM agent_tools LIMIT 10");
  r.rows.forEach(t=>console.log(`  ${JSON.stringify(t)}`));

  // BONUS: How many unique tables even exist
  console.log(`\n▓▓▓ TOTAL: ${tables.rows.length} tables in public schema ▓▓▓`);
  
  await p.end();
})();
