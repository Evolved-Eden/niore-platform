import pg from 'pg';
const pool = new pg.Pool({
  host: 'db.jebixydqpvsegvrtfmgm.supabase.co', port: 5432, database: 'postgres',
  user: 'postgres', password: process.argv[2],
  ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 15000,
});

async function main() {
  console.log('═══ BUILDER SYSTEM SETUP ═══\n');

  // 1. Add affiliate tiers to membership_tiers
  console.log('▓▓▓ 1. AFFILIATE TIERS ▓▓▓\n');

  const existing = await pool.query("SELECT key FROM membership_tiers");
  const existingKeys = existing.rows.map(r => r.key);
  console.log('Existing tiers:', existingKeys.join(', '));

  const affiliateTiers = [
    {
      key: 'affiliate_bronze',
      name: 'Bronze Affiliate',
      tier_name: 'Bronze',
      tier_type: 'affiliate',
      is_organization: false, is_creator: false,
      max_vertical_agents: 0, max_custom_agents: 0,
      max_workflows: 0, max_swarm_capacity: 0, max_memory_gbs: 0,
      price_range: 'Free',
      price_sweet_spot: '0',
      commission_rate: '10',
      commissions_rate: '10',
      referral_rules: JSON.stringify({ min_payout: 50, payout_methods: ['stripe', 'paypal'] }),
      status: 'active',
    },
    {
      key: 'affiliate_silver',
      name: 'Silver Affiliate',
      tier_name: 'Silver',
      tier_type: 'affiliate',
      is_organization: false, is_creator: false,
      max_vertical_agents: 0, max_custom_agents: 0,
      max_workflows: 0, max_swarm_capacity: 0, max_memory_gbs: 0,
      price_range: 'Free',
      price_sweet_spot: '0',
      commission_rate: '15',
      commissions_rate: '15',
      referral_rules: JSON.stringify({ min_payout: 100, payout_methods: ['stripe', 'paypal'], bonus_threshold: 10, bonus_rate: 2 }),
      status: 'active',
    },
    {
      key: 'affiliate_gold',
      name: 'Gold Affiliate',
      tier_name: 'Gold',
      tier_type: 'affiliate',
      is_organization: false, is_creator: false,
      max_vertical_agents: 0, max_custom_agents: 0,
      max_workflows: 0, max_swarm_capacity: 0, max_memory_gbs: 0,
      price_range: 'Free',
      price_sweet_spot: '0',
      commission_rate: '20',
      commissions_rate: '20',
      referral_rules: JSON.stringify({ min_payout: 200, payout_methods: ['stripe', 'paypal'], bonus_threshold: 20, bonus_rate: 5, team_commission: 2 }),
      status: 'active',
    },
    {
      key: 'affiliate_platinum',
      name: 'Platinum Affiliate',
      tier_name: 'Platinum',
      tier_type: 'affiliate',
      is_organization: false, is_creator: false,
      max_vertical_agents: 1, max_custom_agents: 1,
      max_workflows: 3, max_swarm_capacity: 1, max_memory_gbs: 1,
      price_range: 'Free',
      price_sweet_spot: '0',
      commission_rate: '25',
      commissions_rate: '25',
      referral_rules: JSON.stringify({ min_payout: 500, payout_methods: ['stripe', 'paypal'], bonus_threshold: 30, bonus_rate: 5, team_commission: 3, dedicated_manager: true }),
      status: 'active',
    },
  ];

  let added = 0;
  for (const tier of affiliateTiers) {
    if (!existingKeys.includes(tier.key)) {
      const {rows} = await pool.query(`
        INSERT INTO membership_tiers (key, name, tier_name, tier_type, is_organization, is_creator,
          max_vertical_agents, max_custom_agents, max_workflows, max_swarm_capacity, max_memory_gbs,
          price_range, price_sweet_spot, commission_rate, commissions_rate, referral_rules, status)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16::jsonb,$17)
        ON CONFLICT (key) DO UPDATE SET
          commission_rate = EXCLUDED.commission_rate,
          commissions_rate = EXCLUDED.commissions_rate,
          referral_rules = EXCLUDED.referral_rules,
          status = EXCLUDED.status
        RETURNING id
      `, [tier.key, tier.name, tier.tier_name, tier.tier_type, tier.is_organization, tier.is_creator,
          tier.max_vertical_agents, tier.max_custom_agents, tier.max_workflows, tier.max_swarm_capacity, tier.max_memory_gbs,
          tier.price_range, tier.price_sweet_spot, tier.commission_rate, tier.commissions_rate, tier.referral_rules, tier.status]);
      console.log(`  Created ${tier.key} (${tier.name})`);
      added++;
    }
  }
  if (added === 0) console.log('  All affiliate tiers already exist');

  // 2. Add affiliate tier entitlements
  console.log('\n▓▓▓ 2. AFFILIATE TIER ENTITLEMENTS ▓▓▓\n');

  const affiliateEnts = affiliateTiers.map(t => ({
    plan_key: t.key,
    max_vertical_agents: t.max_vertical_agents,
    max_custom_agents: t.max_custom_agents,
    max_swarm_capacity: t.max_swarm_capacity,
    max_workflows: t.max_workflows,
    max_ai_memory_gbs: t.max_memory_gbs || 0,
    can_use_legal_addon: false,
    can_use_wealth_addon: false,
    can_use_luxury_hospitality_addon: false,
    can_use_creator_commerce_addon: false,
    status: 'active',
  }));

  let entAdded = 0;
  for (const ent of affiliateEnts) {
    if (!existingKeys.includes(ent.plan_key)) {
      await pool.query(`
        INSERT INTO tier_entitlements (plan_key, max_vertical_agents, max_custom_agents, max_swarm_capacity,
          max_workflows, max_ai_memory_gbs, can_use_legal_addon, can_use_wealth_addon,
          can_use_luxury_hospitality_addon, can_use_creator_commerce_addon, status)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
        ON CONFLICT (plan_key) DO NOTHING
      `, [ent.plan_key, ent.max_vertical_agents, ent.max_custom_agents, ent.max_swarm_capacity,
          ent.max_workflows, ent.max_ai_memory_gbs, ent.can_use_legal_addon, ent.can_use_wealth_addon,
          ent.can_use_luxury_hospitality_addon, ent.can_use_creator_commerce_addon, ent.status]);
      console.log(`  Created entitlements for ${ent.plan_key}`);
      entAdded++;
    }
  }
  if (entAdded === 0) console.log('  All affiliate entitlements already exist');

  // 3. Fill addon flags for EXISTING tiers
  console.log('\n▓▓▓ 3. FILL ADDON FLAGS FOR ALL TIERS ▓▓▓\n');

  // Current tiers with their addon levels
  const addonConfigs = [
    { plan_key: 'client_founder', legal: false, wealth: false, luxury: false, creator: false },
    { plan_key: 'client_teams', legal: true, wealth: false, luxury: true, creator: true },
    { plan_key: 'client_enterprise', legal: true, wealth: true, luxury: true, creator: true },
    { plan_key: 'creator_studio', legal: false, wealth: false, luxury: false, creator: false },
    { plan_key: 'creator_premium', legal: false, wealth: false, luxury: false, creator: true },
    { plan_key: 'creator_concierge', legal: false, wealth: true, luxury: true, creator: true },
  ];

  for (const cfg of addonConfigs) {
    await pool.query(`
      UPDATE tier_entitlements SET
        can_use_legal_addon = $1,
        can_use_wealth_addon = $2,
        can_use_luxury_hospitality_addon = $3,
        can_use_creator_commerce_addon = $4,
        status = 'active'
      WHERE plan_key = $5
    `, [cfg.legal, cfg.wealth, cfg.luxury, cfg.creator, cfg.plan_key]);
    console.log(`  Updated addon flags for ${cfg.plan_key}`);
  }

  // 4. Sync Stripe data — check if stripe.subscriptions has matching data
  console.log('\n▓▓▓ 4. STRIPE SUBSCRIPTIONS SYNC ▓▓▓\n');

  // Find the stripe schema subscriptions
  const {rows: schemas} = await pool.query(`
    SELECT table_schema FROM information_schema.tables 
    WHERE table_name = 'subscriptions' AND table_type = 'BASE TABLE'
  `);
  
  if (schemas.length > 0) {
    const schema = schemas[0].table_schema;
    console.log(`Found stripe subscriptions in schema: ${schema}`);
    
    // Try to join with memberships
    const {rows: stripeSubs} = await pool.query(`
      SELECT id, customer, status, metadata, current_period_end
      FROM "${schema}".subscriptions
      WHERE status = 'active' OR status = 'trialing'
      LIMIT 10
    `);
    console.log(`Active/trialing Stripe subscriptions: ${stripeSubs.length}`);
    
    if (stripeSubs.length > 0) {
      for (const sub of stripeSubs) {
        // Try to match by customer email in users/orgs
        await pool.query(`
          UPDATE memberships SET
            stripe_subscription_id = COALESCE(stripe_subscription_id, $1),
            stripe_customer_id = COALESCE(stripe_customer_id, $2),
            status = CASE WHEN $3 = 'active' THEN 'active' WHEN $3 = 'trialing' THEN 'trial' ELSE status END
          WHERE (stripe_customer_id = $2 OR stripe_subscription_id = $1)
        `, [sub.id, sub.customer, sub.status]);
        console.log(`  Synced subscription ${sub.id} (${sub.status})`);
      }
    } else {
      console.log('  No active Stripe subscriptions to sync');
    }
  } else {
    console.log('  No stripe.subscriptions table found (Stripe extension may not be installed)');
  }

  // Verify final state
  console.log('\n▓▓▓ VERIFICATION ▓▓▓\n');
  const checks = [
    ['membership_tiers total', "SELECT COUNT(*)::int as c FROM membership_tiers"],
    ['affiliate tiers', "SELECT COUNT(*)::int as c FROM membership_tiers WHERE tier_type='affiliate'"],
    ['tier_entitlements total', "SELECT COUNT(*)::int as c FROM tier_entitlements"],
    ['memberships with stripe_id', "SELECT COUNT(*)::int as c FROM memberships WHERE stripe_subscription_id IS NOT NULL"],
    ['entitlements with addon flags', "SELECT COUNT(*)::int as c FROM tier_entitlements WHERE can_use_luxury_hospitality_addon = true OR can_use_wealth_addon = true"],
  ];
  for (const [label, sql] of checks) {
    const r = await pool.query(sql);
    console.log(`  ${label.padEnd(35)} ${r.rows[0].c}`);
  }

  await pool.end();
  console.log('\n═══ BUILDER SYSTEM SETUP COMPLETE ═══');
}

main().catch(e => { console.error('FATAL:', e); process.exit(1); });
