const {Pool}=require('pg');
const p = new Pool({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false }
});
(async()=>{
  // 1. Zuri agent
  console.log('=== ZURI AGENT ===');
  let r = await p.query("SELECT agent_id, agent_name, description, role_type, vertical, archetype_id, primary_template, secondary_template, organization_id FROM agents WHERE agent_name ILIKE '%zuri%' OR agent_name ILIKE '%sovereign%'");
  r.rows.forEach(a=>console.log(JSON.stringify(a, null, 2)));

  // 2. Clients + agent linkages
  console.log('\n=== CLIENTS ===');
  r = await p.query("SELECT id, full_name, email, organization_id, plan_tier_key, client_type FROM clients");
  r.rows.forEach(c=>console.log(JSON.stringify(c, null, 2)));
  
  // Check if any agents have client_id actually set now
  r = await p.query("SELECT count(*) as c FROM agents WHERE client_id IS NOT NULL");
  console.log(`\nAgents with client_id: ${r.rows[0].c}`);

  // 3. n8n workflow templates vs files
  console.log('\n=== N8N TEMPLATES IN DB ===');
  r = await p.query("SELECT id, key, name, workflow_type, stages_json FROM workflow_templates WHERE workflow_type ILIKE '%n8n%' ORDER BY key");
  r.rows.forEach(w=>console.log(`  ${w.key}: ${w.name}`));

  // 4. vertical_subs and specialties
  console.log('\n=== VERTICAL_SUBS TABLE ===');
  r = await p.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name='vertical_subs' ORDER BY ordinal_position");
  r.rows.forEach(c=>console.log(`  ${c.column_name}: ${c.data_type}`));
  r = await p.query("SELECT count(*) as c FROM vertical_subs");
  console.log(`Rows: ${r.rows[0].c}`);
  if (r.rows[0].c > 0) {
    r = await p.query("SELECT * FROM vertical_subs ORDER BY name LIMIT 20");
    r.rows.forEach(v=>console.log(`  ${v.id} | ${v.name || v.key || v.slug} | vertical_id=${v.vertical_id}`));
  }

  console.log('\n=== SPECIALTIES TABLE ===');
  r = await p.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name='specialties' ORDER BY ordinal_position");
  r.rows.forEach(c=>console.log(`  ${c.column_name}: ${c.data_type}`));
  r = await p.query("SELECT count(*) as c FROM specialties");
  console.log(`Rows: ${r.rows[0].c}`);
  if (r.rows[0].c > 0) {
    r = await p.query("SELECT * FROM specialties ORDER BY name LIMIT 20");
    r.rows.forEach(s=>console.log(`  ${s.id} | ${s.name} | type=${s.type||s.category||'-'}`));
  }

  // 5. Check what archetypes exist  
  console.log('\n=== ARCHETYPES ===');
  r = await p.query("SELECT id, key, name, category FROM archetypes LIMIT 10");
  r.rows.forEach(a=>console.log(`  ${a.key}: ${a.name} (${a.category})`));

  // 6. Check agent_types with canonical_template
  console.log('\n=== AGENT TYPES NEEDING TEMPLATES ===');
  r = await p.query("SELECT key, name, category, canonical_template, capabilities FROM agent_types WHERE canonical_template IS NULL OR capabilities IS NULL ORDER BY key");
  r.rows.forEach(a=>console.log(`  ${a.key}: ${a.name} cat=${a.category} templ=${a.canonical_template||'NULL'} caps=${a.capabilities||'NULL'}`));

  // 7. Check existing swarm_templates for orchestration info
  console.log('\n=== SWARM TEMPLATES WITH ORCHESTRATION ===');
  r = await p.query("SELECT key, name, template_type, metadata->>'orchestration_strategy' as strategy FROM swarm_templates WHERE metadata->>'orchestration_strategy' IS NOT NULL LIMIT 5");

  await p.end();
})();
