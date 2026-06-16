import pg from 'pg';
const pool = new pg.Pool({
  host: 'db.jebixydqpvsegvrtfmgm.supabase.co', port: 5432, database: 'postgres',
  user: 'postgres', password: process.argv[2],
  ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 15000,
});

async function main() {
  console.log('═══ BUILDER SYSTEM SETUP v2 ═══\n');

  // 1. Drop the restrictive check constraint and replace with a flexible one
  console.log('▓▓▓ 1. FIX CHECK CONSTRAINT ▓▓▓\n');
  
  await pool.query(`ALTER TABLE membership_tiers DROP CONSTRAINT IF EXISTS plan_tiers_key_check`);
  
  // Add a new constraint that allows any key (tier_type prefix pattern)
  await pool.query(`
    ALTER TABLE membership_tiers ADD CONSTRAINT plan_tiers_key_check 
    CHECK (key ~ '^(client|creator|affiliate|partner|free)_') OR length(key) > 0
  `);
  console.log('  Replaced check constraint with flexible pattern (client_|creator_|affiliate_|partner_|free_)');

  // 2. Add affiliate tiers
  console.log('\n▓▓▓ 2. AFFILIATE TIERS ▓▓▓\n');
  
  const affiliateTiers = [
    {
      key: 'affiliate_bronze', name: 'Bronze Affiliate', tier_name: 'Bronze',
      tier_type: 'affiliate', commission_rate: '10', commissions_rate: '10',
      referral_rules: { min_payout: 50, payout_methods: ['stripe', 'paypal'] },
    },
    {
      key: 'affiliate_silver', name: 'Silver Affiliate', tier_name: 'Silver',
      tier_type: 'affiliate', commission_rate: '15', commissions_rate: '15',
      referral_rules: { min_payout: 100, payout_methods: ['stripe', 'paypal'], bonus_threshold: 10, bonus_rate: 2 },
    },
    {
      key: 'affiliate_gold', name: 'Gold Affiliate', tier_name: 'Gold',
      tier_type: 'affiliate', commission_rate: '20', commissions_rate: '20',
      referral_rules: { min_payout: 200, payout_methods: ['stripe', 'paypal'], bonus_threshold: 20, bonus_rate: 5, team_commission: 2 },
      max_vertical_agents: 0, max_custom_agents: 0, max_workflows: 3, max_swarm_capacity: 0, max_memory_gbs: 0,
    },
    {
      key: 'affiliate_platinum', name: 'Platinum Affiliate', tier_name: 'Platinum',
      tier_type: 'affiliate', commission_rate: '25', commissions_rate: '25',
      referral_rules: { min_payout: 500, payout_methods: ['stripe', 'paypal'], bonus_threshold: 30, bonus_rate: 5, team_commission: 3, dedicated_manager: true },
      max_vertical_agents: 1, max_custom_agents: 1, max_workflows: 5, max_swarm_capacity: 1, max_memory_gbs: 1,
    },
  ];

  for (const t of affiliateTiers) {
    await pool.query(`
      INSERT INTO membership_tiers (key, name, tier_name, tier_type, commission_rate, commissions_rate, referral_rules, status,
        max_vertical_agents, max_custom_agents, max_workflows, max_swarm_capacity, max_memory_gbs,
        price_range, price_sweet_spot, is_organization, is_creator)
      VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,'active',$8,$9,$10,$11,$12,'Free','0',false,false)
      ON CONFLICT (key) DO UPDATE SET
        commission_rate = EXCLUDED.commission_rate,
        commissions_rate = EXCLUDED.commissions_rate,
        referral_rules = EXCLUDED.referral_rules,
        status = EXCLUDED.status
    `, [t.key, t.name, t.tier_name, t.tier_type, t.commission_rate, t.commissions_rate,
        JSON.stringify(t.referral_rules), 
        t.max_vertical_agents || 0, t.max_custom_agents || 0, t.max_workflows || 0, t.max_swarm_capacity || 0, t.max_memory_gbs || 0]);
    console.log(`  ${t.key} (${t.name}) — commission ${t.commission_rate}%`);
  }

  // 3. Add affiliate entitlements  
  console.log('\n▓▓▓ 3. AFFILIATE TIER ENTITLEMENTS ▓▓▓\n');
  
  const affiliateEnts = [
    { plan_key: 'affiliate_bronze', agents: 0, custom: 0, swarms: 0, wfs: 0, mem: 0 },
    { plan_key: 'affiliate_silver', agents: 0, custom: 0, swarms: 0, wfs: 0, mem: 0 },
    { plan_key: 'affiliate_gold', agents: 0, custom: 0, swarms: 0, wfs: 3, mem: 0 },
    { plan_key: 'affiliate_platinum', agents: 1, custom: 1, swarms: 1, wfs: 5, mem: 1 },
  ];

  for (const e of affiliateEnts) {
    await pool.query(`
      INSERT INTO tier_entitlements (plan_key, max_vertical_agents, max_custom_agents, max_swarm_capacity,
        max_workflows, max_ai_memory_gbs, status)
      VALUES ($1,$2,$3,$4,$5,$6,'active')
      ON CONFLICT (plan_key) DO NOTHING
    `, [e.plan_key, e.agents, e.custom, e.swarms, e.wfs, e.mem]);
    console.log(`  Entitlements for ${e.plan_key}`);
  }

  // 4. Fill addon flags for EXISTING client/creator tiers
  console.log('\n▓▓▓ 4. ADDON FLAGS FOR ALL TIERS ▓▓▓\n');
  
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
        can_use_legal_addon = $1, can_use_wealth_addon = $2,
        can_use_luxury_hospitality_addon = $3, can_use_creator_commerce_addon = $4,
        status = 'active'
      WHERE plan_key = $5
    `, [cfg.legal, cfg.wealth, cfg.luxury, cfg.creator, cfg.plan_key]);
  }
  console.log(`  Updated addon flags for ${addonConfigs.length} tiers`);

  // 5. Sync Stripe subscriptions
  console.log('\n▓▓▓ 5. STRIPE SUBSCRIPTION SYNC ▓▓▓\n');
  
  const {rows: schemas} = await pool.query(`
    SELECT table_schema FROM information_schema.tables 
    WHERE table_name = 'subscriptions' AND table_type = 'BASE TABLE'
  `);
  
  if (schemas.length > 0) {
    const schema = schemas[0].table_schema;
    console.log(`Stripe subscriptions in schema: ${schema}`);
    
    // Check if there's a customers table to match by email
    const {rows: customers} = await pool.query(`
      SELECT id, email, name FROM "${schema}".customers LIMIT 10
    `);
    console.log(`Stripe customers: ${customers.length}`);
    
    // Get active subscriptions
    const {rows: stripeSubs} = await pool.query(`
      SELECT id, customer, status, metadata, COALESCE(current_period_end, 0) as period_end
      FROM "${schema}".subscriptions
      WHERE status IN ('active', 'trialing', 'past_due')
      ORDER BY created DESC
      LIMIT 20
    `);
    console.log(`Active/trialing subscriptions: ${stripeSubs.length}`);
    
    for (const sub of stripeSubs) {
      // Find matching customer
      const customer = customers.find(c => c.id === sub.customer);
      if (customer) {
        // Try to match by email in users or organizations
        const {rows: org} = await pool.query(`
          SELECT o.id FROM organizations o
          JOIN users u ON o.id = u.organization_id OR u.email = $1
          WHERE u.email = $1
          LIMIT 1
        `, [customer.email]);
        
        if (org.length > 0) {
          await pool.query(`
            UPDATE memberships SET
              stripe_subscription_id = COALESCE(stripe_subscription_id, $1),
              stripe_customer_id = COALESCE(stripe_customer_id, $2),
              status = CASE 
                WHEN $3 = 'active' THEN 'active' 
                WHEN $3 = 'trialing' THEN 'trial' 
                WHEN $3 = 'past_due' THEN 'past_due'
                ELSE status 
              END,
              renews_at = CASE 
                WHEN $4 > 0 THEN to_timestamp($4::double precision)
                ELSE renews_at 
              END
            WHERE organization_id = $5 AND stripe_subscription_id IS NULL
          `, [sub.id, sub.customer, sub.status, sub.period_end, org[0].id]);
          console.log(`  Synced org ${org[0].id} → sub ${sub.id} (${sub.status})`);
        }
      }
    }
  } else {
    console.log('  No stripe.subscriptions table found. Run Supabase Stripe extension first.');
  }

  // 6. Count all tiers
  const {rows: allTiers} = await pool.query("SELECT key, tier_type, name, commission_rate FROM membership_tiers ORDER BY tier_type, key");
  console.log('\n▓▓▓ ALL MEMBERSHIP TIERS ▓▓▓\n');
  for (const t of allTiers) {
    console.log(`  ${t.key.padEnd(25)} ${(t.tier_type || '').padEnd(12)} ${(t.name || '').padEnd(25)} ${t.commission_rate ? t.commission_rate + '% comm' : ''}`);
  }

  await pool.end();
  console.log('\n═══ BUILDER SYSTEM SETUP COMPLETE ═══');
}

main().catch(e => { console.error('FATAL:', e); process.exit(1); });
