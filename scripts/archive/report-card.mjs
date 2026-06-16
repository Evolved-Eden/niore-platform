import pg from 'pg';
const pool = new pg.Pool({
  host: 'db.jebixydqpvsegvrtfmgm.supabase.co', port: 5432, database: 'postgres',
  user: 'postgres', password: process.argv[2],
  ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 15000,
});

async function check(query, label) {
  const r = await pool.query(query);
  return { label, result: r.rows[0]?.c ?? r.rows[0]?.count ?? JSON.stringify(r.rows[0]) };
}

async function count(table) {
  try {
    const r = await pool.query(`SELECT COUNT(*)::int as c FROM ${table}`);
    return r.rows[0].c;
  } catch { return -1; }
}

async function nulCount(table, col) {
  try {
    const r = await pool.query(`SELECT COUNT(*)::int as c FROM ${table} WHERE ${col} IS NULL`);
    return r.rows[0].c;
  } catch { return -1; }
}

console.log('╔══════════════════════════════════════════════════════╗');
console.log('║            SYSTEM REPORT CARD                        ║');
console.log('╚══════════════════════════════════════════════════════╝\n');

// ═══════ TABLE COUNTS ═══════
console.log('▓▓▓ TABLE COUNTS ▓▓▓\n');
const tables = [
  'agents', 'agent_types', 'agent_capabilities', 'agent_memory', 'agent_swarms', 'agent_generators',
  'swarm_templates', 'swarm_agents', 'agent_swarm_members',
  'blueprint_templates', 'essence_templates', 'workflow_templates', 'workflow_states',
  'archetypes', 'avatars',
  'users', 'clients', 'organizations', 'organization_members',
  'messages', 'notifications',
  'verticals', 'specialties',
  'state_transitions', 'routing_rules', 'sla_policies', 'approval_matrix',
  'integration_endpoints', 'model_configs', 'webhook_endpoints', 'prompt_versions',
  'pricing_plans', 'subscriptions',
  'blueprints', 'essences', 'assessments',
];
for (const t of tables) {
  const c = await count(t);
  const status = c >= 0 ? `${c}`.padStart(6) : '  ERR';
  console.log(`  ${t.padEnd(30)} ${status}`);
}

// ═══════ AGENT HEALTH ═══════
console.log('\n▓▓▓ AGENT HEALTH ▓▓▓\n');
const agentChecks = [
  ['Total agents', "SELECT COUNT(*)::int as c FROM agents"],
  ['ACTIVE health', "SELECT COUNT(*)::int as c FROM agents WHERE health_status = 'ACTIVE'"],
  ['Config state=active', "SELECT COUNT(*)::int as c FROM agents WHERE config_state = 'active'"],
  ['Operational state=active', "SELECT COUNT(*)::int as c FROM agents WHERE operational_state = 'active'"],
  ['Has client_id', "SELECT COUNT(*)::int as c FROM agents WHERE client_id IS NOT NULL"],
  ['Has primary_template', "SELECT COUNT(*)::int as c FROM agents WHERE primary_template IS NOT NULL"],
  ['Has secondary_template', "SELECT COUNT(*)::int as c FROM agents WHERE secondary_template IS NOT NULL"],
  ['Has vertical_subs', "SELECT COUNT(*)::int as c FROM agents WHERE vertical_subs IS NOT NULL AND array_length(vertical_subs, 1) > 0"],
  ['Has specialties', "SELECT COUNT(*)::int as c FROM agents WHERE specialties IS NOT NULL AND array_length(specialties, 1) > 0"],
  ['Has organization_id', "SELECT COUNT(*)::int as c FROM agents WHERE organization_id IS NOT NULL"],
  ['Has mas_score', "SELECT COUNT(*)::int as c FROM agents WHERE mas_score IS NOT NULL"],
  ['Has autonomy_level', "SELECT COUNT(*)::int as c FROM agents WHERE autonomy_level IS NOT NULL"],
  ['NULL role_type', "SELECT COUNT(*)::int as c FROM agents WHERE role_type IS NULL"],
];
for (const [label, sql] of agentChecks) {
  const r = await pool.query(sql);
  console.log(`  ${label.padEnd(30)} ${r.rows[0].c}`);
}

// ═══════ AGENT TYPES ACTIVATION ═══════
console.log('\n▓▓▓ AGENT TYPES ▓▓▓\n');
const typeChecks = [
  ['Total types', "SELECT COUNT(*)::int as c FROM agent_types"],
  ['Has canonical_template', "SELECT COUNT(*)::int as c FROM agent_types WHERE canonical_template IS NOT NULL"],
  ['Has capabilities', "SELECT COUNT(*)::int as c FROM agent_types WHERE capabilities IS NOT NULL"],
  ['Is active', "SELECT COUNT(*)::int as c FROM agent_types WHERE is_active = true"],
  ['Has slug', "SELECT COUNT(*)::int as c FROM agent_types WHERE slug IS NOT NULL"],
  ['Has category', "SELECT COUNT(*)::int as c FROM agent_types WHERE category IS NOT NULL"],
];
for (const [label, sql] of typeChecks) {
  const r = await pool.query(sql);
  console.log(`  ${label.padEnd(30)} ${r.rows[0].c}`);
}

// ═══════ SWARM HEALTH ═══════
console.log('\n▓▓▓ SWARM HEALTH ▓▓▓\n');
const swarmChecks = [
  ['agent_swarms total', "SELECT COUNT(*)::int as c FROM agent_swarms"],
  ['Has orchestration_strategy', "SELECT COUNT(*)::int as c FROM agent_swarms WHERE orchestration_strategy IS NOT NULL"],
  ['Has avg_mas_score', "SELECT COUNT(*)::int as c FROM agent_swarms WHERE avg_mas_score IS NOT NULL"],
  ['swarm_templates total', "SELECT COUNT(*)::int as c FROM swarm_templates"],
  ['Has member_agents', "SELECT COUNT(*)::int as c FROM swarm_templates WHERE member_agents IS NOT NULL"],
  ['Has vertical_key', "SELECT COUNT(*)::int as c FROM swarm_templates WHERE vertical_key IS NOT NULL"],
  ['swarm_agents total', "SELECT COUNT(*)::int as c FROM swarm_agents"],
  ['agent_swarm_members total', "SELECT COUNT(*)::int as c FROM agent_swarm_members"],
];
for (const [label, sql] of swarmChecks) {
  const r = await pool.query(sql);
  console.log(`  ${label.padEnd(30)} ${r.rows[0].c}`);
}

// ═══════ TEMPLATES & WORKFLOWS ═══════
console.log('\n▓▓▓ TEMPLATES & WORKFLOWS ▓▓▓\n');
const tplChecks = [
  ['Blueprint templates', "SELECT COUNT(*)::int as c FROM blueprint_templates"],
  ['Essence templates', "SELECT COUNT(*)::int as c FROM essence_templates"],
  ['Workflow templates', "SELECT COUNT(*)::int as c FROM workflow_templates"],
  ['agent_generators', "SELECT COUNT(*)::int as c FROM agent_generators"],
  ['execution_templates', "SELECT COUNT(*)::int as c FROM execution_templates"],
  ['workflow_states', "SELECT COUNT(*)::int as c FROM workflow_states"],
  ['Has n8n_* workflows', "SELECT COUNT(*)::int as c FROM workflow_templates WHERE key LIKE 'n8n_%'"],
];
for (const [label, sql] of tplChecks) {
  const r = await pool.query(sql);
  console.log(`  ${label.padEnd(30)} ${r.rows[0].c}`);
}

// ═══════ CAPABILITIES ═══════
console.log('\n▓▓▓ CAPABILITIES ▓▓▓\n');
const capChecks = [
  ['agent_capabilities total', "SELECT COUNT(*)::int as c FROM agent_capabilities"],
  ['Linked to agent_id', "SELECT COUNT(*)::int as c FROM agent_capabilities WHERE agent_id IS NOT NULL"],
  ['Has agent_type_key', "SELECT COUNT(*)::int as c FROM agent_capabilities WHERE agent_type_key IS NOT NULL"],
  ['Has workflow_key', "SELECT COUNT(*)::int as c FROM agent_capabilities WHERE workflow_key IS NOT NULL"],
];
for (const [label, sql] of capChecks) {
  const r = await pool.query(sql);
  console.log(`  ${label.padEnd(30)} ${r.rows[0].c}`);
}

// ═══════ MISSING VALUES SCAN ═══════
console.log('\n▓▓▓ CRITICAL NULL VALUE SCAN ▓▓▓\n');
const nullChecks = [
  ['agents.client_id', 'agents', 'client_id'],
  ['agents.primary_template', 'agents', 'primary_template'],
  ['agents.vertical', 'agents', 'vertical'],
  ['agents.role_type', 'agents', 'role_type'],
  ['agents.organization_id', 'agents', 'organization_id'],
  ['agents.health_status', 'agents', 'health_status'],
  ['agents.agent_name', 'agents', 'agent_name'],
  ['agents.autonomy_level', 'agents', 'autonomy_level'],
  ['agents.authority_level', 'agents', 'authority_level'],
  ['agents.risk_level', 'agents', 'risk_level'],
  ['agent_types.canonical_template', 'agent_types', 'canonical_template'],
  ['agent_types.capabilities', 'agent_types', 'capabilities'],
  ['agent_swarms.orchestration_strategy', 'agent_swarms', 'orchestration_strategy'],
  ['swarm_templates.member_agents', 'swarm_templates', 'member_agents'],
  ['agent_capabilities.agent_id', 'agent_capabilities', 'agent_id'],
  ['workflow_templates.stages_json', 'workflow_templates', 'stages_json'],
  ['workflow_templates.swarms_json', 'workflow_templates', 'swarms_json'],
];
for (const [label, table, col] of nullChecks) {
  const n = await nulCount(table, col);
  const status = n === 0 ? '✅ CLEAN' : n > 0 ? `⚠️  ${n} NULL` : '❌ ERROR';
  console.log(`  ${label.padEnd(40)} ${status}`);
}

// ═══════ OLD TABLE CLEANUP ═══════
console.log('\n▓▓▓ CLEANUP STATUS ▓▓▓\n');
const cleanupChecks = [
  ['generators table (should be gone)', "SELECT COUNT(*)::int as c FROM information_schema.tables WHERE table_name='generators'"],
  ['Old legacy tables >0 rows', `
    SELECT count(*)::int as c FROM (
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema='public' AND table_type='BASE TABLE'
    ) t
  `],
];
for (const [label, sql] of cleanupChecks) {
  const r = await pool.query(sql);
  console.log(`  ${label.padEnd(45)} count=${r.rows[0].c}`);
}

// ═══════ ZURI AGENT STATUS ═══════
console.log('\n▓▓▓ ZURI SOVEREIGN AGENT STATUS ▓▓▓\n');
try {
  const r = await pool.query(`
    SELECT agent_id, agent_name, role_type, vertical, health_status, config_state, 
           operational_state, mas_score, client_id IS NOT NULL as has_client,
           primary_template IS NOT NULL as has_primary_tpl,
           secondary_template IS NOT NULL as has_secondary_tpl,
           autonomy_level, authority_level, risk_level
    FROM agents WHERE agent_id = 'AGT-215'
  `);
  if (r.rows.length > 0) {
    const z = r.rows[0];
    console.log(`  Agent:        ${z.agent_name} (${z.agent_id})`);
    console.log(`  Role:         ${z.role_type}`);
    console.log(`  Vertical:     ${z.vertical}`);
    console.log(`  Health:       ${z.health_status}`);
    console.log(`  Config:       ${z.config_state}`);
    console.log(`  Operational:  ${z.operational_state}`);
    console.log(`  MAS Score:    ${z.mas_score}`);
    console.log(`  Has Client:   ${z.has_client ? 'Yes' : 'No'}`);
    console.log(`  Has Primary:  ${z.has_primary_tpl ? 'Yes' : 'No'}`);
    console.log(`  Has Secondary: ${z.has_secondary_tpl ? 'Yes' : 'No'}`);
    console.log(`  Autonomy:     ${z.autonomy_level || '—'}`);
    console.log(`  Authority:    ${z.authority_level || '—'}`);
    console.log(`  Risk:         ${z.risk_level || '—'}`);
  } else {
    console.log('  ⚠️  Zuri (AGT-215) not found');
  }
} catch(e) {
  console.log(`  Error: ${e.message}`);
}

// ═══════ ROLE DISTRIBUTION ═══════
console.log('\n▓▓▓ ROLE DISTRIBUTION (last check) ▓▓▓\n');
const r = await pool.query("SELECT COALESCE(role_type, 'NULL') as role, COUNT(*)::int as c FROM agents GROUP BY role_type ORDER BY c DESC");
for (const row of r.rows) {
  console.log(`  ${row.role.padEnd(20)} ${row.c}`);
}

await pool.end();
console.log('\n╔══════════════════════════════════════════╗');
console.log('║        REPORT CARD COMPLETE              ║');
console.log('╚══════════════════════════════════════════╝');
