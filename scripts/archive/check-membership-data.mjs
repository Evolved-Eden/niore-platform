import pg from 'pg';
const pool = new pg.Pool({
  host: 'db.jebixydqpvsegvrtfmgm.supabase.co', port: 5432, database: 'postgres',
  user: 'postgres', password: process.argv[2],
  ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 15000,
});

// Check membership_tiers content
const {rows: tiers} = await pool.query("SELECT * FROM membership_tiers");
console.log('=== MEMBERSHIP TIERS ===');
for (const t of tiers) {
  console.log(`\n  ${t.key || t.tier_name || t.name}:`);
  console.log(`    id: ${t.id}`);
  console.log(`    name: ${t.name || t.tier_name}`);
  console.log(`    key: ${t.key}`);
  console.log(`    tier_type: ${t.tier_type}`);
  console.log(`    price_range: ${t.price_range}`);
  console.log(`    price_sweet_spot: ${t.price_sweet_spot}`);
  console.log(`    max_vertical_agents: ${t.max_vertical_agents}`);
  console.log(`    max_workflows: ${t.max_workflows}`);
  console.log(`    max_swarm_capacity: ${t.max_swarm_capacity}`);
  console.log(`    commission_rate: ${t.commission_rate}`);
  console.log(`    status: ${t.status}`);
}

// Check tier_entitlements
const {rows: ents} = await pool.query("SELECT * FROM tier_entitlements");
console.log('\n=== TIER ENTITLEMENTS ===');
for (const e of ents) {
  console.log(`\n  plan_key: ${e.plan_key}`);
  console.log(`    max_vertical_agents: ${e.max_vertical_agents}`);
  console.log(`    max_custom_agents: ${e.max_custom_agents}`);
  console.log(`    max_swarm_capacity: ${e.max_swarm_capacity}`);
  console.log(`    max_workflows: ${e.max_workflows}`);
  console.log(`    max_ai_memory_gbs: ${e.max_ai_memory_gbs}`);
  console.log(`    can_use_legal_addon: ${e.can_use_legal_addon}`);
  console.log(`    can_use_wealth_addon: ${e.can_use_wealth_addon}`);
  console.log(`    status: ${e.status}`);
}

// Check memberships
const {rows: m} = await pool.query("SELECT * FROM memberships");
console.log(`\n=== MEMBERSHIPS (${m.length}) ===`);
for (const x of m) {
  console.log(`  org=${x.organization_id} tier=${x.membership_tier_id} status=${x.status} stripe=${x.stripe_subscription_id?.slice(0,20)}...`);
}

// Check if 'pricing_plans' exists
const {rows: pp} = await pool.query(`
  SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name='pricing_plans') as exists
`);
console.log(`\npricing_plans table exists: ${pp[0].exists}`);

// Check if 'subscriptions' exists
const {rows: subs} = await pool.query(`
  SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name='subscriptions') as exists
`);
console.log(`subscriptions table exists: ${subs[0].exists}`);

await pool.end();
