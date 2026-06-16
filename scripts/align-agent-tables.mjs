// ============================================================
// Align all agent tables: agents ↔ agent_registry
// ↔ agent_definitions
//
// Ensures cross-referencing IDs exist everywhere, reports
// mismatches, and optionally syncs data.
// Usage: node scripts/align-agent-tables.mjs
// ============================================================

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Database connection — always uses shared db.js module
// All credentials come from env vars; DB_HOST and SUPABASE_DB_PASSWORD are required.
import getPool from './db.js';
const pool = getPool();

console.log('========================================');
console.log(' AGENT TABLE ALIGNMENT REPORT');
console.log('========================================\n');

// ── 1. Count each table ─────────────────────────────
const tables = ['agents', 'agent_registry', 'agent_definitions', 'agent_types'];
for (const t of tables) {
  try {
    const { rows } = await pool.query(`SELECT count(*)::int AS c FROM public.${t}`);
    console.log(`  ${t.padEnd(25)} ${rows[0].c} rows`);
  } catch (e) {
    console.log(`  ${t.padEnd(25)} ⚠️  ${e.message}`);
  }
}

// ── 2. Cross-reference agents ↔ agent_registry ──
console.log('\n── Cross-ref: agents ↔ agent_registry ──');
const { rows: eeReg } = await pool.query(`
  SELECT 
    COUNT(DISTINCT e.agent_id) AS in_ee,
    COUNT(DISTINCT r.agent_id) AS in_reg,
    COUNT(DISTINCT e.agent_id) FILTER (WHERE r.agent_id IS NOT NULL) AS in_both,
    COUNT(DISTINCT e.agent_id) FILTER (WHERE r.agent_id IS NULL) AS ee_only,
    COUNT(DISTINCT r.agent_id) FILTER (WHERE e.agent_id IS NULL) AS reg_only
  FROM public.agents e
  FULL OUTER JOIN public.agent_registry r ON e.agent_id = r.agent_id
`);
console.log(`  In agents: ${eeReg[0].in_ee}`);
console.log(`  In agent_registry:      ${eeReg[0].in_reg}`);
console.log(`  In both:                ${eeReg[0].in_both}`);
console.log(`  evolved_eden only:      ${eeReg[0].ee_only}`);
console.log(`  agent_registry only:    ${eeReg[0].reg_only}`);

// List IDs in one but not the other
if (eeReg[0].ee_only > 0) {
  const { rows: only } = await pool.query(`
    SELECT e.agent_id, e.agent_name FROM public.agents e
    LEFT JOIN public.agent_registry r ON e.agent_id = r.agent_id
    WHERE r.agent_id IS NULL LIMIT 10
  `);
  console.log('  Sample IDs only in agents:');
  only.forEach(r => console.log(`    ${r.agent_id} — ${r.agent_name}`));
}
if (eeReg[0].reg_only > 0) {
  const { rows: only } = await pool.query(`
    SELECT r.agent_id, r.name FROM public.agent_registry r
    LEFT JOIN public.agents e ON e.agent_id = r.agent_id
    WHERE e.agent_id IS NULL LIMIT 10
  `);
  console.log('  Sample IDs only in agent_registry:');
  only.forEach(r => console.log(`    ${r.agent_id} — ${r.name}`));
}

// ── 3. Cross-reference agents ↔ agent_definitions ──
console.log('\n── Cross-ref: agents ↔ agent_definitions ──');
const { rows: eeDef } = await pool.query(`
  SELECT 
    COUNT(DISTINCT e.agent_id) FILTER (WHERE d.agent_id IS NOT NULL) AS in_both,
    COUNT(DISTINCT e.agent_id) FILTER (WHERE d.agent_id IS NULL) AS ee_only,
    COUNT(DISTINCT d.agent_id) FILTER (WHERE e.agent_id IS NULL) AS def_only
  FROM public.agents e
  FULL OUTER JOIN public.agent_definitions d ON e.agent_id = d.agent_id
`);
console.log(`  In both:                ${eeDef[0].in_both}`);
console.log(`  evolved_eden only:      ${eeDef[0].ee_only}`);
console.log(`  agent_definitions only: ${eeDef[0].def_only}`);

// ── 4. Check archetype coverage ─────────────────────
console.log('\n── Archetype coverage ──');
const { rows: archCov } = await pool.query(`
  SELECT a_r.archetype_name, count(e.agent_id) AS agent_count
  FROM public.archetypes a_r
  LEFT JOIN public.agents e ON e.archetype_id = a_r.numeric_id
  GROUP BY a_r.archetype_name, a_r.numeric_id
  ORDER BY agent_count DESC
  LIMIT 20
`);
console.log('  Top archetypes by agent count:');
archCov.forEach(r => console.log(`    ${(r.archetype_name || 'NULL').padEnd(18)} ${r.agent_count} agents`));

// Check for agents with archetype IDs not in archetypes table
const { rows: badArch } = await pool.query(`
  SELECT e.archetype_id, e.archetype_name, count(*) AS cnt
  FROM public.agents e
  LEFT JOIN public.archetypes a_r ON e.archetype_id = a_r.numeric_id
  WHERE a_r.numeric_id IS NULL AND e.archetype_id IS NOT NULL
  GROUP BY e.archetype_id, e.archetype_name
`);
if (badArch.length > 0) {
  console.log(`  ⚠️  ${badArch.length} archetype IDs with no matching archetypes table entry:`);
  badArch.forEach(r => console.log(`    ID ${r.archetype_id} (${r.archetype_name}) — ${r.cnt} agents`));
} else {
  console.log('  ✅ All archetype IDs reference valid archetypes');
}

// ── 5. Check for null/empty critical fields ─────────
console.log('\n── Data quality checks ──');
const checks = [
  ['NULL agent_name', "SELECT count(*)::int AS c FROM public.agents WHERE agent_name IS NULL OR agent_name = ''"],
  ['NULL vertical', "SELECT count(*)::int AS c FROM public.agents WHERE vertical IS NULL OR vertical = ''"],
  ['NULL role_type', "SELECT count(*)::int AS c FROM public.agents WHERE role_type IS NULL OR role_type = ''"],
  ['NULL archetype_id', "SELECT count(*)::int AS c FROM public.agents WHERE archetype_id IS NULL"],
  ['NULL mas (computed)', "SELECT count(*)::int AS c FROM public.agents WHERE mas IS NULL"],
  ['MAS = 0 (reserved)', "SELECT count(*)::int AS c FROM public.agents WHERE mas = 0"],
  ['health_status != ACTIVE', "SELECT count(*)::int AS c FROM public.agents WHERE health_status IS DISTINCT FROM 'ACTIVE'"],
];
for (const [name, sql] of checks) {
  const { rows } = await pool.query(sql);
  if (rows[0].c > 0) {
    console.log(`  ⚠️  ${name}: ${rows[0].c}`);
  } else {
    console.log(`  ✅ ${name}: 0`);
  }
}

// ── 6. Agent catalog view test ──────────────────────
console.log('\n── Agent catalog view ──');
try {
  const { rows: cat } = await pool.query('SELECT count(*)::int AS c FROM public.agent_catalog');
  console.log(`  ✅ agent_catalog view: ${cat[0].c} rows`);
} catch (e) {
  console.log(`  ⚠️  agent_catalog view: ${e.message}`);
}

console.log('\n========================================');
console.log(' ALIGNMENT REPORT COMPLETE');
console.log('========================================');

await pool.end();
