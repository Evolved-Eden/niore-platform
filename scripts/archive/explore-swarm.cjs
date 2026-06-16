const {Pool}=require('pg');
const p = new Pool({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false }
});
(async()=>{
  // 1. Tables with 'swarm' in name
  console.log('=== TABLES WITH "swarm" IN NAME ===');
  let r=await p.query("SELECT table_name FROM information_schema.tables WHERE table_name LIKE '%swarm%' AND table_schema='public'");
  r.rows.forEach(r=>console.log(' ', r.table_name));

  // 2. Check if agent_swarms table exists
  console.log('\n=== AGENT_SWARMS ===');
  r=await p.query("SELECT column_name,data_type FROM information_schema.columns WHERE table_name='agent_swarms' ORDER BY ordinal_position");
  if(r.rows.length) r.rows.forEach(c=>console.log(`  ${c.column_name}: ${c.data_type}`));
  else console.log('  (not found)');

  // 3. Check if swarm_templates table exists
  console.log('\n=== SWARM_TEMPLATES ===');
  r=await p.query("SELECT column_name,data_type FROM information_schema.columns WHERE table_name='swarm_templates' ORDER BY ordinal_position");
  if(r.rows.length) r.rows.forEach(c=>console.log(`  ${c.column_name}: ${c.data_type}`));
  else console.log('  (not found)');

  // 4. Check if swarm_configs table exists
  console.log('\n=== SWARM_CONFIGS ===');
  r=await p.query("SELECT column_name,data_type FROM information_schema.columns WHERE table_name='swarm_configs' ORDER BY ordinal_position");
  if(r.rows.length) r.rows.forEach(c=>console.log(`  ${c.column_name}: ${c.data_type}`));
  else console.log('  (not found)');

  // 5. Full agents table columns
  console.log('\n=== AGENTS TABLE (all columns) ===');
  r=await p.query("SELECT column_name,data_type,is_nullable,column_default FROM information_schema.columns WHERE table_name='agents' ORDER BY ordinal_position");
  r.rows.forEach(c=>console.log(`  ${c.column_name}: ${c.data_type}  nullable=${c.is_nullable}  default=${c.column_default||'-'}`));

  // 6. agent_types table
  console.log('\n=== AGENT_TYPES ===');
  r=await p.query("SELECT column_name,data_type FROM information_schema.columns WHERE table_name='agent_types' ORDER BY ordinal_position");
  r.rows.forEach(c=>console.log(`  ${c.column_name}: ${c.data_type}`));
  console.log('\nAll agent_types rows:');
  r=await p.query("SELECT * FROM agent_types ORDER BY name");
  r.rows.forEach(t=>console.log(`  ${t.name} | category=${t.category} | ${t.description?.substring(0,80)||''}`));

  // 7. Check agents for swarm-related columns
  console.log('\n=== AGENTS with swarm fields populated ===');
  r=await p.query("SELECT a.id, a.name, a.swarm_template_id, a.swarm_config, a.agent_type_key FROM agents a WHERE a.swarm_template_id IS NOT NULL OR a.swarm_config IS NOT NULL LIMIT 20");
  console.log(`  Found ${r.rows.length} agents with swarm fields`);
  r.rows.forEach(a=>console.log(`  id=${a.id} name=${a.name} swarm_template_id=${a.swarm_template_id} swarm_config=${JSON.stringify(a.swarm_config)} agent_type=${a.agent_type_key}`));

  await p.end();
})();
