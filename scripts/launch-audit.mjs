import getPool from './db.js';
const pool = getPool();

async function count(table) { try { const r = await pool.query(`SELECT COUNT(*)::int as c FROM ${table}`); return r.rows[0].c; } catch { return -1; } }

console.log('═══ PRE-LAUNCH AUDIT ═══\n');

// 1. What does the client experience look like?
console.log('▓▓▓ CLIENT EXPERIENCE ▓▓▓');
console.log(`  Client-facing pages:`);
console.log(`    /dashboard/client/zuri - Zuri chat interface`);
console.log(`    /dashboard/client/twin - Digital twin`);
console.log(`    /dashboard/client/vault - Document storage`);
console.log(`    /dashboard/client/blueprint/assess - Blueprint assessment`);
console.log(`    /dashboard/client/settings - Account settings`);

// 2. Check key system tables
console.log('\n▓▓▓ KEY SYSTEM TABLES FOR LAUNCH ▓▓▓');
const keyTables = [
  ['agents', 'Core AI agents'], ['agent_swarms', 'Agent swarms'],
  ['swarm_templates', 'Swarm templates'], ['workflow_templates', 'Workflow definitions'],
  ['blueprint_templates', 'Blueprint templates'], ['essence_templates', 'Essence templates'],
  ['agent_generators', 'Generator configurations'],
  ['users', 'Platform users'], ['clients', 'Client accounts'],
  ['organizations', 'Organizations'], ['organization_members', 'Org membership'],
  ['archetypes', 'Agent archetypes'], ['avatars', 'Agent avatars'],
  ['workflow_states', 'Workflow state tracking'],
  ['state_transitions', 'State transitions'],
  ['pricing_plans', 'Pricing plans'], ['subscriptions', 'Subscriptions'],
];
let launchReady = true;
for (const [t, desc] of keyTables) {
  const c = await count(t);
  const ok = c > 0;
  if (!ok) launchReady = false;
  console.log(`  ${ok ? '✅' : '❌'} ${t.padEnd(25)} ${String(c).padStart(6)}  ${desc}`);
}

// 3. Agent readiness
console.log('\n▓▓▓ AGENT LAUNCH READINESS ▓▓▓');
const checks = [
  ['Agents with all required fields', `SELECT COUNT(*)::int as c FROM agents WHERE 
    agent_id IS NOT NULL AND agent_name IS NOT NULL AND vertical IS NOT NULL 
    AND role_type IS NOT NULL AND health_status = 'ACTIVE'
    AND client_id IS NOT NULL AND primary_template IS NOT NULL`],
  ['Agents with enricheable profile', `SELECT COUNT(*)::int as c FROM agents WHERE
    tagline IS NOT NULL AND icon IS NOT NULL AND avatar IS NOT NULL`],
  ['CORE agents', `SELECT COUNT(*)::int as c FROM agents WHERE role_type = 'CORE'`],
  ['VERTICAL agents', `SELECT COUNT(*)::int as c FROM agents WHERE role_type = 'VERTICAL'`],
  ['CRISIS agents', `SELECT COUNT(*)::int as c FROM agents WHERE role_type = 'CRISIS'`],
  ['BRIDGE agents', `SELECT COUNT(*)::int as c FROM agents WHERE role_type = 'BRIDGE'`],
  ['CROSS_SYSTEM agents', `SELECT COUNT(*)::int as c FROM agents WHERE role_type = 'CROSS_SYSTEM'`],
  ['UTILITY agents', `SELECT COUNT(*)::int as c FROM agents WHERE role_type = 'UTILITY'`],
];
for (const [label, sql] of checks) {
  const r = await pool.query(sql);
  console.log(`  ${label.padEnd(40)} ${r.rows[0].c}`);
}

// 4. Swarm readiness
console.log('\n▓▓▓ SWARM LAUNCH READINESS ▓▓▓');
const swarmCheck = [
  ['agent_swarms total', 'agent_swarms'],
  ['active swarms', `SELECT COUNT(*)::int as c FROM agent_swarms`],
  ['swarm_agents (memberships)', 'swarm_agents'],
  ['agent_swarm_members', 'agent_swarm_members'],
];
for (const [label, sql] of swarmCheck) {
  const c = await count(sql);
  console.log(`  ${label.padEnd(30)} ${typeof c === 'string' ? c : c}`);
}

// Check swarm_agents distribution
const {rows: swarmDist} = await pool.query(`
  SELECT s.name, count(sa.*)::int as member_count 
  FROM agent_swarms s LEFT JOIN swarm_agents sa ON s.id = sa.swarm_id
  GROUP BY s.id, s.name ORDER BY member_count DESC LIMIT 10
`);
console.log('  Top swarms by membership:');
for (const s of swarmDist) {
  console.log(`    ${(s.name || '?').padEnd(30)} ${s.member_count} members`);
}

// 5. n8n workflow status
console.log('\n▓▓▓ n8n WORKFLOW STATUS ▓▓▓');
const n8nCount = await count(`workflow_templates WHERE key LIKE 'n8n_%'`);
console.log(`  n8n templates in DB: ${n8nCount}`);
console.log(`  n8n JSON files on disk: 5 (WF1-WF5)`);
console.log(`  n8n credentials valid: ❌ — current N8N_MCP_TOKEN returns 401`);
console.log(`  Total potential: ${n8nCount + 5} workflow templates`);
console.log(`  Current # of n8n workflow templates: ${n8nCount}`);

// 6. Missing links
console.log('\n▓▓▓ MISSING LINKS / GAPS ▓▓▓');
const gaps = [
  ['agent_capabilities without agent', "SELECT COUNT(*)::int as c FROM agent_capabilities WHERE agent_id IS NULL"],
  ['agent_capabilities without workflow_key', "SELECT COUNT(*)::int as c FROM agent_capabilities WHERE workflow_key IS NULL"],
  ['swarm_templates without vertical_key', "SELECT COUNT(*)::int as c FROM swarm_templates WHERE vertical_key IS NULL"],
  ['execution_templates (should be >0 for prod)', "SELECT COUNT(*)::int as c FROM execution_templates"],
  ['agents without avatar', "SELECT COUNT(*)::int as c FROM agents WHERE avatar IS NULL"],
  ['agents without tagline', "SELECT COUNT(*)::int as c FROM agents WHERE tagline IS NULL"],
  ['agents without icon', "SELECT COUNT(*)::int as c FROM agents WHERE icon IS NULL"],
];
for (const [label, sql] of gaps) {
  const r = await pool.query(sql);
  console.log(`  ${label.padEnd(50)} ${r.rows[0].c}`);
}

// 7. Summary
console.log('\n▓▓▓ LAUNCH READINESS SUMMARY ▓▓▓\n');

const allCount = await count('agents');
const userCount = await count('users');
const clientCount = await count('clients');
const templateCount = await count('blueprint_templates') + await count('essence_templates') + await count('workflow_templates');

const issues = [];

if (allCount < 400) issues.push(`Only ${allCount} agents (target: 400+)`);
if (userCount < 3) issues.push(`Only ${userCount} users (need at least admin + test)`);
if (templateCount < 200) issues.push(`Only ${templateCount} templates (target: 200+)`);
if (n8nCount < 8) issues.push(`Only ${n8nCount} n8n workflows in DB`);

const {rows: nullAvatars} = await pool.query("SELECT COUNT(*)::int as c FROM agents WHERE avatar IS NULL");
if (nullAvatars[0].c > 0) issues.push(`${nullAvatars[0].c} agents missing avatars (visual polish)`);
const {rows: nullTaglines} = await pool.query("SELECT COUNT(*)::int as c FROM agents WHERE tagline IS NULL");
if (nullTaglines[0].c > 0) issues.push(`${nullTaglines[0].c} agents missing taglines`);

console.log(`  Agents:     ${allCount}`);
console.log(`  Users:      ${userCount}`);
console.log(`  Clients:    ${clientCount}`);
console.log(`  Templates:  ${templateCount}`);
console.log(`  n8n in DB:  ${n8nCount} (+5 JSON files pending deploy)`);
console.log(`  Swarms:     ${swarmDist.length} vertical swarms`);

if (issues.length === 0) {
  console.log('\n  ✅ No critical issues found');
} else {
  console.log(`\n  ⚠️  ${issues.length} issue(s):`);
  for (const i of issues) console.log(`    • ${i}`);
}

// Launch readiness score
let score = 100;
score -= nullAvatars[0].c > 300 ? 15 : nullAvatars[0].c > 100 ? 10 : nullAvatars[0].c > 0 ? 5 : 0;
score -= nullTaglines[0].c > 300 ? 10 : nullTaglines[0].c > 100 ? 5 : nullTaglines[0].c > 0 ? 3 : 0;
score -= allCount < 400 ? 10 : 0;
score -= n8nCount < 8 ? 15 : 0;

console.log(`\n  📊 LAUNCH READINESS SCORE: ${score}/100`);
if (score >= 90) console.log('  🟢 Launch-ready — minor polish only');
else if (score >= 70) console.log('  🟡 Close — 1-2 sessions of work');
else if (score >= 50) console.log('  🟠 Needs work — 2-3 sessions');
else console.log('  🔴 Major gaps — 4+ sessions needed');

await pool.end();
