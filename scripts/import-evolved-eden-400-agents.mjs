// ============================================================
// Import evolved_eden_400_agents.csv into agents
// Usage: node scripts/import-evolved-eden-400-agents.mjs
// Env: SUPABASE_DB_URL or DB_HOST + SUPABASE_DB_PASSWORD
// ============================================================

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Database connection — always uses shared db.js module
// All credentials come from env vars; DB_HOST and SUPABASE_DB_PASSWORD are required.
import getPool from './db.js';
const pool = getPool();

// Read CSV from project root
const csvPath = join(__dirname, '..', 'evolved_eden_400_agents.csv');
const csvRaw = readFileSync(csvPath, 'utf8');
const lines = csvRaw.trim().split('\n');

// Parse header
const header = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));

// Parse rows — multiple CSV quality issues are corrected here:
//
// 1. Column shift (225 agents): Bridge, Utility, Crisis, Cross-System,
//    Swarm, Reserved, Executive agents are missing the Role_Type value.
//    The Archetype_ID value leaked into the Role_Type position, shifting
//    all subsequent columns left by 1.
//    Fix: detect when Role_Type (pos 4) is numeric, then splice empty into pos 4.
//
// 2. Variable field count: the Generator_Models field (pos 13) can contain
//    internal commas when an agent has multiple GEN entries (e.g.
//    "[GEN-001,GEN-002]"). Since this field is not quoted in the CSV, the
//    naive parser splits on those commas, producing extra fields.
//    Fix: work from the end — the last 8 fields (Capability through
//    Health_Status) are always present and correctly ordered.
//
// 3. Missing empty trailing fields: some rows omit empty values for
//    Tertiary_System_Range (pos 12), shortening the row.
//    Fix: reconstructed via the "work from end" approach.
const EXP_COLS = 22;             // expected 22 columns
const SCORE_COLS = 8;            // last 8 fields: Capability..Health_Status
const META_COLS = EXP_COLS - SCORE_COLS; // 14 meta fields: Agent_ID..Generator_Models

const isNumericField = (v) => /^\d+$/.test(v?.trim());

const rows = [];
for (let i = 1; i < lines.length; i++) {
  const line = lines[i];
  const values = [];
  let current = '';
  let inQuotes = false;
  for (const ch of line) {
    if (ch === '"') { inQuotes = !inQuotes; continue; }
    if (ch === ',' && !inQuotes) { values.push(current.trim()); current = ''; continue; }
    current += ch;
  }
  values.push(current.trim());

  // === Fix 1: column shift ===
  const rawRoleType = values[4] || '';
  if (isNumericField(rawRoleType)) {
    // Shifted row — insert empty Role_Type at position 4,
    // pushing Archetype_ID etc back to their correct positions
    values.splice(4, 0, '');
  }

  // === Fix 2 & 3: normalize field count ===
  // The last SCORE_COLS values (Capability..Health_Status) are always
  // present and in order. Everything before that is the "meta" block.
  const N = values.length;
  const endFields = N >= SCORE_COLS ? values.slice(-SCORE_COLS) : [];
  const metaBlock = N >= SCORE_COLS ? values.slice(0, N - SCORE_COLS) : values.slice(0);

  // Reconstruct 14 meta fields (Agent_ID..Generator_Models):
  //   meta[0..11]  = Agent_ID through Secondary_System_Range (12 fields)
  //   meta[12]     = Tertiary_System_Range (range "X-Y" or empty)
  //   meta[13]     = Generator_Models ("[GEN-...]" — may be split across
  //                  multiple array entries due to unquoted commas)
  const afterSecondary = metaBlock.slice(12);
  let tertiaryRange, genModelsJoined;
  if (afterSecondary.length === 0) {
    tertiaryRange = '';
    genModelsJoined = '';
  } else if (afterSecondary[0].startsWith('[GEN-')) {
    // Tertiary_System_Range was omitted — this IS Generator_Models
    tertiaryRange = '';
    genModelsJoined = afterSecondary.join(',');
  } else {
    tertiaryRange = afterSecondary[0];
    genModelsJoined = afterSecondary.slice(1).join(',');
  }
  const beforeGen = metaBlock.slice(0, 12);
  const fixed = [...beforeGen, tertiaryRange, genModelsJoined, ...endFields];

  const row = {};
  header.forEach((h, idx) => { row[h] = fixed[idx] || ''; });
  rows.push(row);
}

console.log(`Parsed ${rows.length} agents from CSV`);

// Insert into agents
let inserted = 0;
let skipped = 0;
let errors = 0;

// Parse generator_models field (format: [GEN-001,GEN-002] or [GEN-001] or empty)
function parseGenerators(val) {
  if (!val || val === '[]' || val === '') return [];
  return val.replace(/^\[|\]$/g, '').split(',').map(g => g.trim()).filter(Boolean);
}

// Parse system ranges (format: "141-155" or "1-30" or empty)
function parseRange(val) {
  if (!val || val.trim() === '') return null;
  return val.trim();
}

for (const row of rows) {
  try {
    const agentId = row['Agent_ID'];
    if (!agentId) { skipped++; continue; }

    const genModels = parseGenerators(row['Generator_Models']);
    const mas = parseFloat(row['MAS']) || 0;
    const capability = parseInt(row['Capability']) || 0;
    const trust = parseInt(row['Trust']) || 0;
    const activation = parseInt(row['Activation']) || 0;
    const synergy = parseInt(row['Synergy']) || 0;
    const risk = parseInt(row['Risk']) || 0;
    const evolution = parseInt(row['Evolution']) || 0;
    const healthStatus = row['Health_Status'] || 'ACTIVE';
    // Role_Type fallback: for shifted rows the real role type is in Subvertical
    const roleType = row['Role_Type'] || row['Subvertical'] || '';
    const archetypeId = parseInt(row['Archetype_ID']) || null;
    const archetypeName = row['Archetype_Name'] || null;

    const { error } = await pool.query(`
      INSERT INTO public.agents (
        agent_id, agent_name, vertical, subvertical, role_type,
        archetype_id, archetype_name, avatar,
        primary_template, secondary_template,
        primary_system_range, secondary_system_range, tertiary_system_range,
        generator_models,
        capability, trust, activation, synergy, risk, evolution,
        reported_mas, health_status
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22)
      ON CONFLICT (agent_id) DO UPDATE SET
        agent_name = EXCLUDED.agent_name,
        vertical = EXCLUDED.vertical,
        subvertical = EXCLUDED.subvertical,
        role_type = EXCLUDED.role_type,
        archetype_id = EXCLUDED.archetype_id,
        archetype_name = EXCLUDED.archetype_name,
        avatar = EXCLUDED.avatar,
        primary_template = EXCLUDED.primary_template,
        secondary_template = EXCLUDED.secondary_template,
        primary_system_range = EXCLUDED.primary_system_range,
        secondary_system_range = EXCLUDED.secondary_system_range,
        tertiary_system_range = EXCLUDED.tertiary_system_range,
        generator_models = EXCLUDED.generator_models,
        capability = EXCLUDED.capability,
        trust = EXCLUDED.trust,
        activation = EXCLUDED.activation,
        synergy = EXCLUDED.synergy,
        risk = EXCLUDED.risk,
        evolution = EXCLUDED.evolution,
        reported_mas = EXCLUDED.reported_mas,
        health_status = EXCLUDED.health_status,
        updated_at = now()
    `, [
      agentId,
      row['Agent_Name'],
      row['Vertical'],
      row['Subvertical'],
      roleType,
      archetypeId,
      archetypeName,
      row['Avatar'],
      row['Primary_Template'],
      row['Secondary_Template'],
      parseRange(row['Primary_System_Range']),
      parseRange(row['Secondary_System_Range']),
      parseRange(row['Tertiary_System_Range']),
      genModels,
      capability, trust, activation, synergy, risk, evolution,
      mas, healthStatus
    ]);

    if (error) { errors++; console.error(`  ❌ ${agentId}: ${error.message}`); }
    else { inserted++; }
  } catch (e) {
    errors++;
    console.error(`  ❌ Row ${inserted + skipped + errors}: ${e.message}`);
  }
}

console.log(`\n✅ Import complete: ${inserted} inserted/updated, ${skipped} skipped, ${errors} errors`);

// Run verification
const { rows: count } = await pool.query('SELECT count(*)::int AS c FROM public.agents');
console.log(`Total agents in agents table: ${count[0].c}`);

await pool.end();
