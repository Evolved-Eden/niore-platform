/**
 * seed-all-agents.mjs
 * 
 * Seeding strategy:
 * 1. evolved_eden_agents has 442 pre-seeded agents with verticals already assigned
 * 2. agents table was recreated — agent_id column changed to UUID, 0 rows remain
 * 3. We: fix agent_id back to text → insert all EE agents → assign roles/archetypes/avatars
 *    → remove reserved agents
 * 
 * Role type mapping (evolved_eden_agents.role_type → proper name):
 *   'Core' → 'CORE', 'Vertical' → 'VERTICAL'
 *   Numbers → archetype IDs that leaked into role_type — infer from vertical
 *   Reserved → remove
 * 
 * Avatar mapping by role_type:
 *   CORE → Eden, VERTICAL → Nova, BRIDGE → Orion
 *   CROSS_SYSTEM → Liora/Seren, UTILITY → Axel
 *   CRISIS → Alaric, SWARM → Quest
 */

import pg from 'pg';

// ============================================================
// 1. CONFIG
// ============================================================
const pool = new pg.Pool({
  host: process.env.DB_HOST || 'db.jebixydqpvsegvrtfmgm.supabase.co',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'postgres',
  user: process.env.DB_USER || 'postgres',
  password: process.env.SUPABASE_DB_PASSWORD ,
  ssl: { rejectUnauthorized: false },
});

// Proper role types
const ROLE_TYPES = ['CORE', 'VERTICAL', 'BRIDGE', 'CROSS_SYSTEM', 'UTILITY', 'CRISIS', 'SWARM'];

// Avatar keys mapped by role_type
const ROLE_AVATARS = {
  CORE: 'eden',
  VERTICAL: 'nova',
  BRIDGE: 'orion',
  CROSS_SYSTEM: 'seren',
  UTILITY: 'axel',
  CRISIS: 'alaric',
  SWARM: 'quest',
};

const AVATAR_IDS = {
  eden: 'eden',
  nova: 'nova',
  orion: 'orion',
  seren: 'seren',
  liora: 'liora',
  axel: 'axel',
  alaric: 'alaric',
  quest: 'quest',
};

// ============================================================
// 2. INFER PROPER ROLE TYPE FROM AGENT NAME/VERTICAL
// ============================================================
function inferRoleType(agentName, vertical, currentRoleType) {
  const name = (agentName || '').toLowerCase();
  const vert = (vertical || '').toLowerCase();

  // If already a proper name, normalize
  if (currentRoleType && ROLE_TYPES.includes(currentRoleType.toUpperCase())) {
    return currentRoleType.toUpperCase();
  }

  // CORE — platform-level orchestrators
  if (vert === 'core' || 
      name.includes('orchestrator') || name.includes('conductor') || 
      name.includes('sovereign') || name.includes('twin') ||
      name.includes('meta') || name.includes('master conductor') ||
      name.includes('identity architect') || name.includes('governance')) {
    return 'CORE';
  }

  // CRISIS
  if (vert === 'crisis' || vert === 'addiction' || vert === 'mental_health' ||
      name.includes('crisis') || name.includes('naloxone') || name.includes('suicide') ||
      name.includes('detox') || name.includes('relapse')) {
    return 'CRISIS';
  }

  // BRIDGE
  if (vert === 'bridge' || name.includes('bridge') || name.includes('concierge') ||
      name.includes('front desk') || name.includes('intake consultation')) {
    return 'BRIDGE';
  }

  // CROSS_SYSTEM
  if (name.includes('intelligence') || name.includes('analyst') || 
      name.includes('forecast') || name.includes('analytics') ||
      name.includes('market') || name.includes('data')) {
    return 'CROSS_SYSTEM';
  }

  // UTILITY
  if (name.includes('utility') || name.includes('billing') || name.includes('automation') ||
      name.includes('onboarding') || name.includes('document') ||
      name.includes('compliance monitor') || name.includes('research') ||
      name.includes('workforce') || name.includes('talent') ||
      name.includes('operations sentinel') || name.includes('employee')) {
    return 'UTILITY';
  }

  // SWARM
  if (vert === 'swarm' || name.includes('swarm')) {
    return 'SWARM';
  }

  // Default: VERTICAL for industry-specific agents
  return 'VERTICAL';
}

function inferArchetypeNumber(roleType, index) {
  // Map role types to archetype ranges
  const ranges = {
    CORE: [1, 9],
    VERTICAL: [10, 99],
    BRIDGE: [100, 109],
    CROSS_SYSTEM: [110, 119],
    UTILITY: [120, 124],
    CRISIS: [125, 127],
    SWARM: [128],
  };
  const range = ranges[roleType] || [10, 99];
  const [min, max] = range;
  const offset = index % (max - min + 1);
  return min + offset;
}

function inferAvatarKey(roleType) {
  return ROLE_AVATARS[roleType] || 'nova';
}

// ============================================================
// 3. MAIN
// ============================================================
async function main() {
  console.log('=== SEED ALL AGENTS ===\n');

  // ---- 3a. ALTER agent_id column from UUID → TEXT ----
  console.log('Fixing agent_id column type (uuid → text)...');
  // Drop dependent view first, will recreate after
  await pool.query('DROP VIEW IF EXISTS canonical_swarm_composition CASCADE');
  await pool.query('ALTER TABLE agents ALTER COLUMN agent_id TYPE text');
  await pool.query('ALTER TABLE agents ALTER COLUMN agent_id DROP DEFAULT');
  // Recreate the view
  await pool.query(`
    CREATE OR REPLACE VIEW canonical_swarm_composition AS
    SELECT agent_id, slug, agent_name, organization_id, business_id, client_id, 
           agent_type, role_type, vertical, vertical_subs, mas_score, mas_vector, 
           mas_state, mas_last_eval
    FROM agents
  `);
  console.log('  Done.\n');

  // ---- 3b. Load EE data ----
  const eeAll = await pool.query("SELECT * FROM evolved_eden_agents ORDER BY agent_id");
  console.log(`evolved_eden_agents: ${eeAll.rows.length} rows\n`);

  // ---- 3c. Find reserved agents to remove ----
  const reservedEE = eeAll.rows.filter(r => 
    r.vertical === 'reserved' || r.health_status === 'RESERVED'
  );
  console.log(`Reserved agents (to DELETE): ${reservedEE.length}`);
  for (const r of reservedEE) {
    console.log(`  ${r.agent_id}: ${r.agent_name}`);
  }
  console.log();

  // First, clean the agents table (no data to lose)
  await pool.query('DELETE FROM agents');
  console.log('Cleared agents table.\n');

  // ---- 3d. Sync evolved_eden_agents → agents table ----
  console.log('=== SYNCING EE → AGENTS TABLE ===');
  
  const nonReservedEE = eeAll.rows.filter(r => 
    r.vertical !== 'reserved' && r.health_status !== 'RESERVED'
  );
  
  console.log(`Non-reserved EE agents to sync: ${nonReservedEE.length}`);

  let insertCount = 0;

  for (let i = 0; i < nonReservedEE.length; i++) {
    const ee = nonReservedEE[i];

    // Infer proper role type
    const properRole = inferRoleType(ee.agent_name, ee.vertical, ee.role_type);

    // Infer archetype number (cycled through range for role type)
    const archNum = inferArchetypeNumber(properRole, i);
    const archetypeId = `ARC-${String(archNum).padStart(3, '0')}`;

    // Infer avatar
    const avatarKey = inferAvatarKey(properRole);

    await pool.query(`
      INSERT INTO agents (agent_id, agent_name, vertical, vertical_subs, role_type, health_status, archetype_id, avatar, slug)
      VALUES ($1, $2, $3, $4::text[], $5, $6, $7, $8, $9)
    `, [
      ee.agent_id,
      ee.agent_name,
      ee.vertical || 'unknown',
      ee.subvertical ? `{${ee.subvertical}}` : null,
      properRole,
      ee.health_status || 'ACTIVE',
      archetypeId,
      avatarKey,
      ee.agent_id,
    ]);
    insertCount++;

    if (i < 3 || i === nonReservedEE.length - 1) {
      console.log(`  [${i}] Inserted: ${ee.agent_id} → ${properRole} / ${archetypeId} / ${avatarKey}`);
    }
    if ((i + 1) % 100 === 0 || i === nonReservedEE.length - 1) {
      console.log(`  Progress: ${i + 1}/${nonReservedEE.length} (inserted: ${insertCount})`);
    }
  }

  console.log(`\nDone: ${insertCount} agents inserted`);

  // ---- 3e. Delete reserved agents from evolved_eden_agents ----
  if (reservedEE.length > 0) {
    console.log('\n=== REMOVING RESERVED AGENTS ===');
    for (const r of reservedEE) {
      await pool.query('DELETE FROM evolved_eden_agents WHERE agent_id = $1', [r.agent_id]);
      console.log(`  Removed from EE: ${r.agent_id}`);
    }
  }

  // ---- 3f. Fix numeric role types in agents table ----
  console.log('\n=== FIXING NUMERIC / NULL ROLE TYPES ===');
  const badRoles = await pool.query(`
    SELECT agent_id, agent_name, vertical, role_type 
    FROM agents 
    WHERE role_type IS NULL OR role_type ~ '^\\d+$'
  `);
  console.log(`Agents to fix: ${badRoles.rows.length}`);
  for (const r of badRoles.rows) {
    const role = inferRoleType(r.agent_name, r.vertical, null);
    await pool.query('UPDATE agents SET role_type = $1 WHERE agent_id = $2', [role, r.agent_id]);
  }

  // ---- 3g. Also fix numeric role types in evolved_eden_agents ----
  const eeBadRoles = await pool.query(`
    SELECT agent_id, agent_name, vertical, role_type
    FROM evolved_eden_agents
    WHERE role_type ~ '^\\d+$'
  `);
  console.log(`EE agents with numeric role_type: ${eeBadRoles.rows.length}`);
  for (const r of eeBadRoles.rows) {
    const role = inferRoleType(r.agent_name, r.vertical, null);
    await pool.query('UPDATE evolved_eden_agents SET role_type = $1 WHERE agent_id = $2', [role, r.agent_id]);
  }

  // ---- 3h. Final summary ----
  console.log('\n=== FINAL SUMMARY ===');
  const finalCounts = await pool.query(`
    SELECT role_type, COUNT(*) as count FROM agents GROUP BY role_type ORDER BY COUNT(*) DESC
  `);
  console.table(finalCounts.rows);

  const vertCounts = await pool.query(`
    SELECT vertical, COUNT(*) as count FROM agents WHERE vertical IS NOT NULL GROUP BY vertical ORDER BY COUNT(*) DESC LIMIT 20
  `);
  console.log('\nTop verticals:');
  console.table(vertCounts.rows);

  const totalAgents = await pool.query('SELECT COUNT(*) FROM agents');
  console.log(`\nTotal agents: ${totalAgents.rows[0].count}`);

  const totalEE = await pool.query('SELECT COUNT(*) FROM evolved_eden_agents');
  console.log(`Total evolved_eden_agents: ${totalEE.rows[0].count}`);

  await pool.end();
  console.log('\nDone!');
}

main().catch(err => {
  console.error('FATAL:', err);
  process.exit(1);
});
