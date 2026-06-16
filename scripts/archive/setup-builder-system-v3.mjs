import pg from 'pg';
const pool = new pg.Pool({
  host: 'db.jebixydqpvsegvrtfmgm.supabase.co', port: 5432, database: 'postgres',
  user: 'postgres', password: process.argv[2],
  ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 15000,
});

async function main() {
  console.log('═══ BUILDER SYSTEM SETUP v3 ═══\n');

  // 1. Fix the check constraint
  console.log('▓▓▓ 1. FIX CHECK CONSTRAINT ▓▓▓\n');
  await pool.query(`ALTER TABLE membership_tiers DROP CONSTRAINT IF EXISTS plan_tiers_key_check`);
  await pool.query(`ALTER TABLE membership_tiers ADD CONSTRAINT plan_tiers_key_check CHECK (key ~ '^[a-z]+_[a-z_]+$')`);
  console.log('  Replaced with flexible regex constraint (^[a-z]+_[a-z_]+$)');

  // 2. Add affiliate tiers
  console.log('\n▓▓▓ 2. AFFILIATE TIERS ▓▓▓\n');
  
  const tiers = [
    { key: 'affiliate_bronze', name: 'Bronze Affiliate', tier_name: 'Bronze', type: 'affiliate', comm: '10', 
      rules: { min_payout: 50, payout_methods: ['stripe', 'paypal'] } },
    { key: 'affiliate_silver', name: 'Silver Affiliate', tier_name: 'Silver', type: 'affiliate', comm: '15',
      rules: { min_payout: 100, payout_methods: ['stripe', 'paypal'], bonus_threshold: 10, bonus_rate: 2 } },
    { key: 'affiliate_gold', name: 'Gold Affiliate', tier_name: 'Gold', type: 'affiliate', comm: '20',
      rules: { min_payout: 200, payout_methods: ['stripe', 'paypal'], bonus_threshold: 20, bonus_rate: 5, team_commission: 2 },
      agents: 0, wfs: 3 },
    { key: 'affiliate_platinum', name: 'Platinum Affiliate', tier_name: 'Platinum', type: 'affiliate', comm: '25',
      rules: { min_payout: 500, payout_methods: ['stripe', 'paypal'], bonus_threshold: 30, bonus_rate: 5, team_commission: 3, dedicated_manager: true },
      agents: 1, wfs: 5, swarms: 1 },
  ];

  for (const t of tiers) {
    const commRate = parseFloat(t.comm) / 100;
    await pool.query(`
      INSERT INTO membership_tiers (key, name, tier_name, tier_type, commission_rate, commissions_rate, 
        referral_rules, status, max_vertical_agents, max_workflows, max_swarm_capacity, max_memory_gbs,
        price_range, price_sweet_spot, is_organization, is_creator)
      VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7::jsonb,'active',$8,$9,$10,0,'Free','0',false,false)
      ON CONFLICT (key) DO UPDATE SET
        commission_rate = EXCLUDED.commission_rate,
        commissions_rate = EXCLUDED.commissions_rate,
        referral_rules = EXCLUDED.referral_rules,
        status = EXCLUDED.status
    `, [t.key, t.name, t.tier_name, t.type, commRate, JSON.stringify({ rate: t.comm, type: 'percentage' }), JSON.stringify(t.rules),
        t.agents || 0, t.wfs || 0, t.swarms || 0]);
    console.log(`  ${t.key} (${t.name}) — ${t.comm}% commission`);
  }

  // 3. Add affiliate entitlements
  console.log('\n▓▓▓ 3. AFFILIATE ENTITLEMENTS ▓▓▓\n');
  for (const t of tiers) {
    await pool.query(`
      INSERT INTO tier_entitlements (plan_key, max_vertical_agents, max_custom_agents, max_swarm_capacity,
        max_workflows, max_ai_memory_gbs, status)
      VALUES ($1,$2,0,$3,$4,0,'active')
      ON CONFLICT (plan_key) DO NOTHING
    `, [t.key, t.agents || 0, t.swarms || 0, t.wfs || 0]);
    console.log(`  Entitlements for ${t.key}`);
  }

  // 4. Fill addon flags for ALL tiers
  console.log('\n▓▓▓ 4. ADDON FLAGS ▓▓▓\n');
  const addons = [
    ['client_founder', false, false, false, false],
    ['client_teams', true, false, true, true],
    ['client_enterprise', true, true, true, true],
    ['creator_studio', false, false, false, false],
    ['creator_premium', false, false, false, true],
    ['creator_concierge', false, true, true, true],
    ['affiliate_bronze', false, false, false, false],
    ['affiliate_silver', false, false, false, false],
    ['affiliate_gold', false, false, false, false],
    ['affiliate_platinum', false, false, false, false],
  ];
  for (const [key, legal, wealth, luxury, creator] of addons) {
    const r = await pool.query(`
      UPDATE tier_entitlements SET
        can_use_legal_addon = $2, can_use_wealth_addon = $3,
        can_use_luxury_hospitality_addon = $4, can_use_creator_commerce_addon = $5,
        status = 'active'
      WHERE plan_key = $1
    `, [key, legal, wealth, luxury, creator]);
    if (r.rowCount > 0) console.log(`  ${key} — legal=${legal} wealth=${wealth} luxury=${luxury} creator=${creator}`);
  }

  // 5. Sync Stripe subscriptions
  console.log('\n▓▓▓ 5. STRIPE SYNC ▓▓▓\n');
  const {rows: schemas} = await pool.query(
    "SELECT table_schema FROM information_schema.tables WHERE table_name='subscriptions' AND table_type='BASE TABLE'"
  );
  
  if (schemas.length > 0) {
    const schema = schemas[0].table_schema;
    const {rows: subs} = await pool.query(`
      SELECT s.id, s.customer, s.status, s.current_period_end, c.email, c.name
      FROM "${schema}".subscriptions s
      LEFT JOIN "${schema}".customers c ON c.id = s.customer
      WHERE s.status IN ('active','trialing','past_due')
      ORDER BY s.created DESC LIMIT 20
    `);
    console.log(`Found ${subs.length} active Stripe subscriptions`);
    
    let synced = 0;
    for (const sub of subs) {
      if (sub.email) {
        // Match by email across users
        const {rows: users} = await pool.query(
          "SELECT id, email FROM users WHERE email = $1 LIMIT 1", [sub.email]
        );
        if (users.length > 0) {
          // Find their org membership
          const {rows: orgs} = await pool.query(
            "SELECT organization_id FROM organization_members WHERE user_id = $1 LIMIT 1", [users[0].id]
          );
          if (orgs.length > 0) {
            const r = await pool.query(`
              UPDATE memberships SET
                stripe_subscription_id = COALESCE(stripe_subscription_id, $1),
                stripe_customer_id = COALESCE(stripe_customer_id, $2),
                status = CASE WHEN $3 = 'active' THEN 'active' WHEN $3 = 'trialing' THEN 'trial' ELSE status END,
                renews_at = CASE WHEN $4 > 0 THEN to_timestamp($4::double precision) ELSE renews_at END
              WHERE organization_id = $5 AND stripe_subscription_id IS NULL
            `, [sub.id, sub.customer, sub.status, sub.current_period_end || 0, orgs[0].organization_id]);
            if (r.rowCount > 0) {
              console.log(`  Synced ${sub.email} → sub ${sub.id} (${sub.status})`);
              synced++;
            }
          }
        }
      }
    }
    if (synced === 0) console.log('  No new Stripe subscriptions to sync (already linked or no email match)');
  } else {
    console.log('  No stripe subscriptions table — run Supabase Stripe extension first');
  }

  // 6. Verify
  console.log('\n▓▓▓ VERIFICATION ▓▓▓\n');
  const checks = [
    ['membership_tiers', "SELECT COUNT(*)::int as c FROM membership_tiers"],
    ['affiliate tiers', "SELECT COUNT(*)::int as c FROM membership_tiers WHERE tier_type='affiliate'"],
    ['tier_entitlements', "SELECT COUNT(*)::int as c FROM tier_entitlements"],
    ['entitlements with addons', "SELECT COUNT(*)::int as c FROM tier_entitlements WHERE can_use_luxury_hospitality_addon = true"],
    ['memberships with stripe_id', "SELECT COUNT(*)::int as c FROM memberships WHERE stripe_subscription_id IS NOT NULL"],
  ];
  for (const [label, sql] of checks) {
    const r = await pool.query(sql);
    console.log(`  ${label.padEnd(30)} ${r.rows[0].c}`);
  }

  // List all tiers
  const {rows: all} = await pool.query("SELECT key, tier_type, name, commission_rate FROM membership_tiers ORDER BY tier_type, key");
  console.log('\nAll tiers:');
  for (const t of all) console.log(`  ${t.key.padEnd(25)} ${(t.tier_type||'').padEnd(12)} ${(t.name||'').padEnd(25)} ${t.commission_rate ? t.commission_rate + '%' : ''}`);

  await pool.end();
  console.log('\n═══ SETUP COMPLETE ═══');
}

main().catch(e => { console.error('FATAL:', e); process.exit(1); });
