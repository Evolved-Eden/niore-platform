const {Pool}=require('pg');
const p = new Pool({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false }
});
(async()=>{
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║          COMPREHENSIVE SYSTEM DIAGNOSTIC        ║');
  console.log('╚══════════════════════════════════════════════════╝\n');

  // ─── PART 1: NULL SCAN ALL TABLES ───
  console.log('▓▓▓ PART 1: NULL SCAN (ALL TABLES) ▓▓▓\n');
  let tables = await p.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE' ORDER BY table_name");
  for (const t of tables.rows) {
    const tn = t.table_name;
    const totalR = await p.query(`SELECT count(*) as c FROM "${tn}"`);
    const total = totalR.rows[0].c;
    if (total === 0) continue;
    const cols = await p.query(`SELECT column_name FROM information_schema.columns WHERE table_name='${tn}' AND table_schema='public' AND column_name NOT IN ('id','created_at','updated_at') ORDER BY ordinal_position`);
    let nullCols = [];
    for (const c of cols.rows) {
      try {
        const nr = await p.query(`SELECT count(*) as c FROM "${tn}" WHERE "${c.column_name}" IS NULL`);
        if (nr.rows[0].c > 0) nullCols.push({col: c.column_name, nulls: nr.rows[0].c, pct: Math.round(nr.rows[0].c/total*1000)/10});
      } catch(e) {/* skip type issues */}
    }
    if (nullCols.length > 0) {
      console.log(`\n  ${tn} (${total} rows):`);
      for (const nc of nullCols) console.log(`    ${nc.col}: ${nc.nulls} NULL (${nc.pct}%)`);
    }
  }

  // ─── PART 2: FOREIGN KEY RELATIONSHIPS ───
  console.log('\n\n▓▓▓ PART 2: FOREIGN KEY MAP ▓▓▓\n');
  const fks = await p.query(`
    SELECT
      tc.table_schema, tc.table_name, kcu.column_name,
      ccu.table_schema AS foreign_table_schema,
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public'
    ORDER BY tc.table_name, kcu.column_name
  `);
  if (fks.rows.length === 0) console.log('  (NO FOREIGN KEYS FOUND — likely using Supabase REST relationships instead)');
  else fks.rows.forEach(f=>console.log(`  ${f.table_name}.${f.column_name} → ${f.foreign_table_name}.${f.foreign_column_name}`));

  // ─── PART 3: EMPTY TABLES ───
  console.log('\n\n▓▓▓ PART 3: EMPTY TABLES (0 rows) ▓▓▓\n');
  let empty = [];
  for (const t of tables.rows) {
    const r = await p.query(`SELECT count(*) as c FROM "${t.table_name}"`);
    if (r.rows[0].c === 0) empty.push(t.table_name);
  }
  if (empty.length === 0) console.log('  No empty tables found');
  else empty.forEach(t=>console.log(`  ${t}`));

  // ─── PART 4: org_id vs organization_id ───
  console.log('\n\n▓▓▓ PART 4: COLUMNS WITH "org_id" (not "organization_id") ▓▓▓\n');
  const orgCols = await p.query(`
    SELECT table_name, column_name FROM information_schema.columns 
    WHERE table_schema='public' AND column_name LIKE '%org%id%' AND column_name != 'organization_id'
    ORDER BY table_name
  `);
  if (orgCols.rows.length === 0) console.log('  No "org_id" columns found — all use "organization_id" convention');
  else orgCols.forEach(c=>console.log(`  ${c.table_name}.${c.column_name}`));

  // ─── PART 5: AGENT COLUMN DETAIL ───
  console.log('\n\n▓▓▓ PART 5: AGENT FIELD DETAILS ▓▓▓\n');
  let r;
  r = await p.query("SELECT count(*) as c FROM agents WHERE agent_id NOT LIKE 'AGT-%' AND agent_id IS NOT NULL");
  console.log(`  agent_id NOT in AGT-XXX format: ${r.rows[0].c}`);
  
  r = await p.query("SELECT vertical_subs FROM agents WHERE vertical_subs IS NOT NULL LIMIT 5");
  console.log(`  vertical_subs samples (${r.rows.length}):`);
  r.rows.forEach(v=>console.log(`    ${JSON.stringify(v.vertical_subs)}`));

  r = await p.query(`SELECT autonomy_level, authority_level, risk_level, 
    count(*) as cnt FROM agents GROUP BY autonomy_level, authority_level, risk_level ORDER BY cnt DESC LIMIT 5`);
  console.log('  autonomy/authority/risk level distribution:');
  r.rows.forEach(v=>console.log(`    auto=${v.autonomy_level} auth=${v.authority_level} risk=${v.risk_level}: ${v.cnt}`));
  
  r = await p.query("SELECT decision_mode, count(*) as cnt FROM agents WHERE decision_mode IS NOT NULL GROUP BY decision_mode ORDER BY cnt DESC");
  console.log('  decision_mode values:', r.rows.map(v=>v.decision_mode+'('+v.cnt+')').join(', '));
  
  r = await p.query("SELECT count(*) as cnt FROM agents WHERE icon IS NOT NULL AND icon != '{}'");
  console.log(`  agents with icon: ${r.rows[0].cnt}`);
  r = await p.query("SELECT icon FROM agents WHERE icon IS NOT NULL AND icon != '{}' LIMIT 3");
  r.rows.forEach(v=>console.log(`    icon sample: ${JSON.stringify(v.icon)}`));
  
  r = await p.query("SELECT count(*) as cnt FROM agents WHERE tagline IS NOT NULL");
  console.log(`  agents with tagline: ${r.rows[0].cnt}`);
  r = await p.query("SELECT agent_name, tagline FROM agents WHERE tagline IS NOT NULL LIMIT 5");
  r.rows.forEach(v=>console.log(`    ${v.agent_name}: "${v.tagline}"`));

  // ─── PART 6: GENERATORS OVERLAP ───
  console.log('\n\n▓▓▓ PART 6: GENERATORS OVERLAP CHECK ▓▓▓\n');
  r = await p.query("SELECT generator_id, generator_name, generator_type FROM agent_generators ORDER BY generator_id");
  console.log(`  agent_generators: ${r.rows.length} rows`);
  r.rows.forEach(g=>console.log(`    ${g.generator_id}: ${g.generator_name} (${g.generator_type})`));
  
  r = await p.query("SELECT gen_id, generator_name FROM generators ORDER BY gen_id");
  console.log(`\n  generators table: ${r.rows.length} rows`);
  r.rows.forEach(g=>console.log(`    ${g.gen_id}: ${g.generator_name}`));
  
  const overlap = await p.query("SELECT count(*) as c FROM generators g WHERE EXISTS (SELECT 1 FROM agent_generators ag WHERE ag.generator_id = g.gen_id)");
  console.log(`\n  Overlap (same ID in both tables): ${overlap.rows[0].c}`);

  // ─── PART 7: n8n WORKFLOW STATUS ───
  console.log('\n\n▓▓▓ PART 7: n8n WORKFLOW STATUS ▓▓▓\n');
  r = await p.query("SELECT count(*) as c FROM workflow_templates WHERE workflow_type LIKE '%n8n%' OR workflow_type LIKE '%N8N%'");
  console.log(`  n8n workflow templates: ${r.rows[0].c}`);
  r = await p.query("SELECT key, name, workflow_type FROM workflow_templates WHERE (workflow_type LIKE '%n8n%' OR workflow_type LIKE '%N8N%') LIMIT 10");
  r.rows.forEach(w=>console.log(`    ${w.key}: ${w.name} (${w.workflow_type})`));

  // Search all columns for 'n8n' pattern
  console.log('\n  Searching all tables for "n8n" references...');
  let n8nRefs = [];
  for (const t of tables.rows) {
    const cols = await p.query(`SELECT column_name FROM information_schema.columns WHERE table_name='${t.table_name}' AND data_type IN ('text','character varying')`);
    for (const c of cols.rows) {
      try {
        const nr = await p.query(`SELECT count(*) as cnt FROM "${t.table_name}" WHERE "${c.column_name}"::text ILIKE '%n8n%'`);
        if (nr.rows[0].cnt > 0) n8nRefs.push({table: t.table_name, col: c.column_name, cnt: nr.rows[0].cnt});
      } catch(e) {}
    }
  }
  if (n8nRefs.length === 0) console.log('  (none found)');
  else n8nRefs.forEach(n=>console.log(`  ${n.table}.${n.col}: ${n.cnt} refs`));

  // ─── PART 8: organization_id COVERAGE ───
  console.log('\n\n▓▓▓ PART 8: organization_id COVERAGE BY TABLE ▓▓▓\n');
  const orgTables = await p.query(`
    SELECT table_name FROM information_schema.columns WHERE table_schema='public' AND column_name='organization_id' ORDER BY table_name
  `);
  for (const t of orgTables.rows) {
    const tot = await p.query(`SELECT count(*) as c FROM "${t.table_name}"`);
    if (tot.rows[0].c === 0) { console.log(`  ${t.table_name}: (empty table)`); continue; }
    const filled = await p.query(`SELECT count(*) as c FROM "${t.table_name}" WHERE organization_id IS NOT NULL`);
    const pct = Math.round(filled.rows[0].c/tot.rows[0].c*1000)/10;
    console.log(`  ${t.table_name}: ${filled.rows[0].c}/${tot.rows[0].c} (${pct}%)`);
  }

  // ─── PART 9: HEALTH STATUS ───
  console.log('\n\n▓▓▓ PART 9: AGENT HEALTH STATUS ▓▓▓\n');
  r = await p.query("SELECT health_status, count(*) as cnt FROM agents GROUP BY health_status ORDER BY cnt DESC");
  console.log('  health_status distribution:');
  r.rows.forEach(h=>console.log(`    ${h.health_status}: ${h.cnt}`));

  r = await p.query("SELECT operational_state, count(*) as cnt FROM agents GROUP BY operational_state ORDER BY cnt DESC");
  console.log('  operational_state distribution:');
  r.rows.forEach(s=>console.log(`    ${s.operational_state}: ${s.cnt}`));

  r = await p.query("SELECT config_state, count(*) as cnt FROM agents GROUP BY config_state ORDER BY cnt DESC");
  console.log('  config_state distribution:');
  r.rows.forEach(c=>console.log(`    ${c.config_state}: ${c.cnt}`));

  await p.end();
  console.log('\n╔══════════════════════════════════════════════════╗');
  console.log('║           DIAGNOSTIC COMPLETE                    ║');
  console.log('╚══════════════════════════════════════════════════╝');
})();
