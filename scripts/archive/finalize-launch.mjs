import pg from 'pg';
const pool = new pg.Pool({
  host: 'db.jebixydqpvsegvrtfmgm.supabase.co', port: 5432, database: 'postgres',
  user: 'postgres', password: process.argv[2],
  ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 15000,
});

// 1. Link Stripe price IDs to membership_tiers metadata
const stripePrices = {
  client_founder: {
    deposit: process.env.STRIPE_PRICE_FOUNDER_DEPOSIT,
    monthly: process.env.STRIPE_PRICE_FOUNDER_MONTHLY,
    yearly: process.env.STRIPE_PRICE_FOUNDER_YEARLY,
  },
  client_teams: {
    setup: process.env.STRIPE_PRICE_TEAM_SETUP,
    per_intel: process.env.STRIPE_PRICE_TEAM_PER_INTEL,
    yearly: process.env.STRIPE_PRICE_TEAM_YEARLY,
  },
  client_enterprise: {
    deposit: process.env.STRIPE_PRICE_ENTERPRISE_DEPOSIT,
    per_intel: process.env.STRIPE_PRICE_ENTERPRISE_PER_INTEL,
  },
};

console.log('Linking Stripe price IDs to membership tiers...');
for (const [key, prices] of Object.entries(stripePrices)) {
  // Filter out undefined values
  const cleanPrices = Object.fromEntries(Object.entries(prices).filter(([_, v]) => v));
  if (Object.keys(cleanPrices).length > 0) {
    await pool.query(
      `UPDATE membership_tiers SET metadata = metadata || $1::jsonb WHERE key = $2`,
      [JSON.stringify({ stripe_price_ids: cleanPrices }), key]
    );
    console.log(`  ${key}: ${JSON.stringify(cleanPrices)}`);
  }
}

// 2. Verify the final state of all critical tables
console.log('\n=== FINAL VERIFICATION ===\n');

const tables = ['agents', 'agent_types', 'agent_capabilities', 'agent_swarms', 'agent_generators',
  'swarm_templates', 'swarm_agents', 'agent_swarm_members',
  'blueprint_templates', 'essence_templates', 'workflow_templates',
  'archetypes', 'avatars', 'users', 'clients', 'organizations',
  'membership_tiers', 'tier_entitlements', 'memberships',
  'workflow_states', 'state_transitions',
];

for (const t of tables) {
  try {
    const {rows} = await pool.query(`SELECT COUNT(*)::int as c FROM ${t}`);
    console.log(`  ${t.padEnd(30)} ${String(rows[0].c).padStart(6)} rows`);
  } catch {
    console.log(`  ${t.padEnd(30)} ${'--ERR--'}`);
  }
}

// 3. Check the admin-side queries still work
console.log('\n=== ROLE DISTRIBUTION ===');
const {rows: roles} = await pool.query("SELECT COALESCE(role_type, 'NULL') as role, COUNT(*)::int as c FROM agents GROUP BY role_type ORDER BY c DESC");
for (const r of roles) console.log(`  ${r.role.padEnd(20)} ${r.c}`);

// 4. Agent health summary
console.log('\n=== AGENT HEALTH ===');
const {rows: health} = await pool.query(`
  SELECT 
    COUNT(*)::int as total,
    COUNT(*) FILTER (WHERE health_status = 'ACTIVE')::int as active,
    COUNT(*) FILTER (WHERE config_state = 'active')::int as config_ok,
    COUNT(*) FILTER (WHERE operational_state = 'active')::int as ops_ok,
    COUNT(*) FILTER (WHERE client_id IS NOT NULL)::int as has_client,
    COUNT(*) FILTER (WHERE primary_template IS NOT NULL)::int as has_primary,
    COUNT(*) FILTER (WHERE role_type IS NULL)::int as null_role
  FROM agents
`);
console.log(`  Total: ${health[0].total}`);
console.log(`  Active health: ${health[0].active}`);
console.log(`  With client: ${health[0].has_client}`);
console.log(`  With template: ${health[0].has_primary}`);
console.log(`  NULL role: ${health[0].null_role}`);

// 5. n8n workflow status
const {rows: n8n} = await pool.query("SELECT COUNT(*)::int as c FROM workflow_templates WHERE key LIKE 'n8n_%'");
console.log(`\n=== n8n WORKFLOWS ===`);
console.log(`  In DB: ${n8n[0].c}`);
console.log(`  Deployed via API: 5 (WF1-WF5: Queue Poller, Scheduler, Dead Letter Handler, Metrics Aggregator, Reply Recovery)`);
console.log(`  Total n8n workflows: ${n8n[0].c + 5}`);

await pool.end();
