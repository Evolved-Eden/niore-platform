/**
 * Seed sample data into Evolved Eden / Hoodacity Supabase tables.
 * Run: node scripts/seed-data.mjs
 * Uses SUPABASE_DB_PASSWORD env var or direct password
 */
import pg from "pg";

const PASSWORD = process.argv[2] || process.env.SUPABASE_DB_PASSWORD ;
const PROJECT_REF = "jebixydqpvsegvrtfmgm";

// ---- Reference IDs from existing data ----
const ORG_ID = "b0eebc99-9c0b-4ef8-9a01-ff0000000001";
const BIZ_ID = "c0eebc99-9c0b-4ef8-9a01-ff0000000001";

const TIER_FOUNDER = "5bcfb509-d4cd-403d-ba78-d8a2df458711";
const TIER_TEAMS = "55c77e1c-1480-4f01-aa01-6a1067578b43";
const TIER_ENTERPRISE = "48f6b5b4-a1f1-43c1-aeff-d9486a5e4ed6";
const TIER_STUDIO = "d8442a13-fd81-4247-89e0-357e4f072d74";
const TIER_PREMIUM = "0dc35d80-62f9-48b8-bc6e-cf3143307b31";
const TIER_CONCIERGE = "8df22497-5a63-4643-bfbe-4c8b96d54515";

// ---- Custom UUIDs for new records ----
const USER_ADMIN = "a0000000-0000-4000-8000-000000000001";
const USER_SOPHIA = "a0000000-0000-4000-8000-000000000002";
const USER_MARCUS = "a0000000-0000-4000-8000-000000000003";
const USER_ELENA = "a0000000-0000-4000-8000-000000000004";
const USER_JAMES = "a0000000-0000-4000-8000-000000000005";

const CLIENT_SOPHIA = "b0000000-0000-4000-8000-000000000001";
const CLIENT_ELENA = "b0000000-0000-4000-8000-000000000002";
const CLIENT_LUXURY = "b0000000-0000-4000-8000-000000000003";
const CLIENT_WELLNESS = "b0000000-0000-4000-8000-000000000004";
const CLIENT_MEDIA = "b0000000-0000-4000-8000-000000000005";

const IDENTITY_ADMIN = "c0000000-0000-4000-8000-000000000001";
const IDENTITY_SOPHIA = "c0000000-0000-4000-8000-000000000002";
const IDENTITY_MARCUS = "c0000000-0000-4000-8000-000000000003";
const IDENTITY_ELENA = "c0000000-0000-4000-8000-000000000004";
const IDENTITY_JAMES = "c0000000-0000-4000-8000-000000000005";

const MEMBERSHIP_ADMIN = "d0000000-0000-4000-8000-000000000001";
const MEMBERSHIP_SOPHIA = "d0000000-0000-4000-8000-000000000002";
const MEMBERSHIP_MARCUS = "d0000000-0000-4000-8000-000000000003";
const MEMBERSHIP_ELENA = "d0000000-0000-4000-8000-000000000004";
const MEMBERSHIP_JAMES = "d0000000-0000-4000-8000-000000000005";

const ONBOARDING_1 = "e0000000-0000-4000-8000-000000000001";
const ONBOARDING_2 = "e0000000-0000-4000-8000-000000000002";
const ONBOARDING_3 = "e0000000-0000-4000-8000-000000000003";

const WALLET_1 = "f0000000-0000-4000-8000-000000000001";
const WALLET_2 = "f0000000-0000-4000-8000-000000000002";
const WALLET_3 = "f0000000-0000-4000-8000-000000000003";

const TX_1 = "f1000000-0000-4000-8000-000000000001";
const TX_2 = "f1000000-0000-4000-8000-000000000002";
const TX_3 = "f1000000-0000-4000-8000-000000000003";

const PAYMENT_1 = "f2000000-0000-4000-8000-000000000001";
const PAYMENT_2 = "f2000000-0000-4000-8000-000000000002";
const PAYMENT_3 = "f2000000-0000-4000-8000-000000000003";
const PAYMENT_4 = "f2000000-0000-4000-8000-000000000004";

const TWIN_1 = "f3000000-0000-4000-8000-000000000001";
const TWIN_2 = "f3000000-0000-4000-8000-000000000002";
const TWIN_3 = "f3000000-0000-4000-8000-000000000003";

const MEMORY_1 = "f4000000-0000-4000-8000-000000000001";
const MEMORY_2 = "f4000000-0000-4000-8000-000000000002";
const MEMORY_3 = "f4000000-0000-4000-8000-000000000003";
const MEMORY_4 = "f4000000-0000-4000-8000-000000000004";

const PROFILE_1 = "f5000000-0000-4000-8000-000000000001";
const PROFILE_2 = "f5000000-0000-4000-8000-000000000002";
const PROFILE_3 = "f5000000-0000-4000-8000-000000000003";

const KB_1 = "f6000000-0000-4000-8000-000000000001";
const KB_2 = "f6000000-0000-4000-8000-000000000002";
const KB_3 = "f6000000-0000-4000-8000-000000000003";

const REFERRAL_1 = "f7000000-0000-4000-8000-000000000001";
const REFERRAL_2 = "f7000000-0000-4000-8000-000000000002";

const INTERACTION_1 = "f8000000-0000-4000-8000-000000000001";
const INTERACTION_2 = "f8000000-0000-4000-8000-000000000002";

const NOTIFICATION_1 = "f9000000-0000-4000-8000-000000000001";
const NOTIFICATION_2 = "f9000000-0000-4000-8000-000000000002";

const USAGE_1 = "fa000000-0000-4000-8000-000000000001";
const USAGE_2 = "fa000000-0000-4000-8000-000000000002";
const USAGE_3 = "fa000000-0000-4000-8000-000000000003";

const INTEGRATION_1 = "fb000000-0000-4000-8000-000000000001";
const QUOTA_1 = "fc000000-0000-4000-8000-000000000001";

const GOAL_1 = "fd000000-0000-4000-8000-000000000001";
const GOAL_2 = "fd000000-0000-4000-8000-000000000002";

const hosts = [
  { host: `db.${PROJECT_REF}.supabase.co`, port: 5432, user: "postgres", label: "Direct" },
  { host: `aws-0-us-west-1.pooler.supabase.com`, port: 6543, user: `postgres.${PROJECT_REF}`, label: "Pooler" },
];

async function query(client, sql, params = []) {
  try { return await client.query(sql, params); }
  catch (e) { console.error(`  SQL Error: ${e.message.substring(0, 120)}`); return null; }
}

async function seed() {
  for (const { host, port, user, label } of hosts) {
    const pool = new pg.Pool({
      host, port, database: "postgres", user, password: PASSWORD,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 10000,
    });
    try {
      const client = await pool.connect();
      console.log(`🔌 Connected via ${label}`);
      let total = 0;

      // Clean up any partial data from previous failed runs
      console.log("\n🧹 Cleaning partial seed data...");
      const cleanupTables = [
        'user_goals', 'quota_usage', 'usage_metrics', 'notification_logs',
        'interactions', 'referrals', 'knowledge_base', 'human_profiles',
        'ai_memories', 'client_twins', 'wallet_transactions', 'wallets',
        'payments', 'onboarding_submissions', 'memberships', 'entitlements',
        'integrations', 'clients', 'identities', 'users'
      ];
      for (const tbl of cleanupTables) {
        await client.query(`DELETE FROM ${tbl} WHERE id IS NOT NULL`);
      }
      console.log("  ✅ Cleaned up");

      // 1. users (auth users - id must match auth.users)
      console.log("\n📦 Seeding users...");
      const users = [
        [USER_ADMIN, ORG_ID, 'Alex Rivera', 'alex@evolvededen.com', null, 'admin', null, JSON.stringify({})],
        [USER_SOPHIA, ORG_ID, 'Sophia Chen', 'sophia@evolvededen.io', null, 'client', null, JSON.stringify({})],
        [USER_MARCUS, ORG_ID, 'Marcus Johnson', 'marcus@example.com', null, 'creator', null, JSON.stringify({})],
        [USER_ELENA, ORG_ID, 'Elena Petrova', 'elena@example.com', null, 'client', null, JSON.stringify({})],
        [USER_JAMES, ORG_ID, 'James Wilson', 'james@example.com', null, 'affiliate', null, JSON.stringify({})],
      ];
      for (const u of users) {
        const r = await query(client,
          `INSERT INTO users (id, organization_id, full_name, email, phone, role, avatar_url, metadata, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, now())
           ON CONFLICT (id) DO NOTHING`,
          u
        );
        if (r && r.rowCount) total++;
      }
      console.log(`  ✅ ${total} users`);

      // 2. identities
      console.log("\n📦 Seeding identities...");
      const identRows = [
        [IDENTITY_ADMIN, USER_ADMIN, 'alex@evolvededen.com', 'Alex Rivera', 'admin'],
        [IDENTITY_SOPHIA, USER_SOPHIA, 'sophia@evolvededen.io', 'Sophia Chen', 'client'],
        [IDENTITY_MARCUS, USER_MARCUS, 'marcus@example.com', 'Marcus Johnson', 'creator'],
        [IDENTITY_ELENA, USER_ELENA, 'elena@example.com', 'Elena Petrova', 'client'],
        [IDENTITY_JAMES, USER_JAMES, 'james@example.com', 'James Wilson', 'affiliate'],
      ];
      let n = 0;
      for (const r of identRows) {
        const res = await query(client,
          `INSERT INTO identities (id, auth_user_id, primary_email, display_name, identity_type)
           VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id) DO NOTHING`,
          r
        );
        if (res && res.rowCount) n++;
      }
      console.log(`  ✅ ${n} identities`);

      // 3. clients
      console.log("\n📦 Seeding clients...");
      // client_type allowed: individual, organization, customer, guest
      // onboarding_status allowed: pending, in_progress, completed, archived
      const clientRows = [
        [CLIENT_SOPHIA, ORG_ID, 'Sophia Chen', 'sophia@evolvededen.io', null, 'individual', null, 'wellness', 'active', 'completed'],
        [CLIENT_ELENA, ORG_ID, 'Elena Petrova', 'elena@example.com', null, 'individual', null, 'hospitality', 'active', 'completed'],
        [CLIENT_LUXURY, ORG_ID, 'Luxury Brands Inc', 'info@luxurybrands.com', null, 'organization', null, 'luxury-concierge', 'active', 'completed'],
        [CLIENT_WELLNESS, ORG_ID, 'Wellness Collective', 'hello@wellness.co', null, 'organization', null, 'wellness', 'active', 'completed'],
        [CLIENT_MEDIA, ORG_ID, 'Bright Future Media', 'contact@bfmedia.com', null, 'organization', null, 'media', 'active', 'pending'],
      ];
      n = 0;
      for (const r of clientRows) {
        const res = await query(client,
          `INSERT INTO clients (id, organization_id, full_name, email, phone, client_type, plan_tier_key, primary_vertical, status, onboarding_status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) ON CONFLICT (id) DO NOTHING`,
          r
        );
        if (res && res.rowCount) n++;
      }
      console.log(`  ✅ ${n} clients`);

      // 4. memberships (subscription assignments)
      console.log("\n📦 Seeding memberships...");
      const memRows = [
        [MEMBERSHIP_ADMIN, ORG_ID, TIER_ENTERPRISE, 'active'],
        [MEMBERSHIP_SOPHIA, ORG_ID, TIER_FOUNDER, 'active'],
        [MEMBERSHIP_MARCUS, ORG_ID, TIER_STUDIO, 'active'],
        [MEMBERSHIP_ELENA, ORG_ID, TIER_ENTERPRISE, 'active'],
        [MEMBERSHIP_JAMES, ORG_ID, TIER_FOUNDER, 'trial'],
      ];
      n = 0;
      for (const r of memRows) {
        const res = await query(client,
          `INSERT INTO memberships (id, organization_id, membership_tier_id, status, starts_at)
           VALUES ($1, $2, $3, $4, now()) ON CONFLICT (id) DO NOTHING`,
          r
        );
        if (res && res.rowCount) n++;
      }
      console.log(`  ✅ ${n} memberships`);

      // 5. onboarding_submissions
      console.log("\n📦 Seeding onboarding submissions...");
      // status allowed: draft, provisioned, active, suspended
      const onbRows = [
        [ONBOARDING_1, CLIENT_SOPHIA, 'concierge_booking', 'wellness', JSON.stringify({ goals: 'Automate booking and client follow-up', size: 'solo' }), 'active'],
        [ONBOARDING_2, CLIENT_ELENA, 'concierge_booking', 'hospitality', JSON.stringify({ goals: 'VIP guest management and concierge AI', size: 'team' }), 'active'],
        [ONBOARDING_3, CLIENT_MEDIA, 'intake_consultation', 'media', JSON.stringify({ goals: 'Content creation pipeline', size: 'agency' }), 'draft'],
      ];
      n = 0;
      for (const r of onbRows) {
        const res = await query(client,
          `INSERT INTO onboarding_submissions (id, client_id, agent_type, vertical, raw_payload, status)
           VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (id) DO NOTHING`,
          r
        );
        if (res && res.rowCount) n++;
      }
      console.log(`  ✅ ${n} onboarding submissions`);

      // 6. payments
      console.log("\n📦 Seeding payments...");
      const payRows = [
        [PAYMENT_1, ORG_ID, 49700, 'USD', 'stripe', 'completed', 'txn_001', JSON.stringify({ plan: 'founder' })],
        [PAYMENT_2, ORG_ID, 99700, 'USD', 'stripe', 'completed', 'txn_002', JSON.stringify({ plan: 'teams' })],
        [PAYMENT_3, ORG_ID, 19700, 'USD', 'stripe', 'pending', 'txn_003', JSON.stringify({ plan: 'addon' })],
        [PAYMENT_4, ORG_ID, 249700, 'USD', 'wire', 'completed', 'txn_004', JSON.stringify({ plan: 'enterprise' })],
      ];
      n = 0;
      for (const r of payRows) {
        const res = await query(client,
          `INSERT INTO payments (id, organization_id, amount, currency, payment_provider, payment_status, transaction_id, metadata)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT (id) DO NOTHING`,
          r
        );
        if (res && res.rowCount) n++;
      }
      console.log(`  ✅ ${n} payments`);

      // 7. wallets
      console.log("\n📦 Seeding wallets...");
      const walRows = [
        [WALLET_1, ORG_ID, 500000],
        [WALLET_2, ORG_ID, 1000000],
        [WALLET_3, ORG_ID, 25000],
      ];
      n = 0;
      for (const r of walRows) {
        const res = await query(client,
          `INSERT INTO wallets (id, organization_id, balance) VALUES ($1, $2, $3) ON CONFLICT (id) DO NOTHING`,
          r
        );
        if (res && res.rowCount) n++;
      }
      console.log(`  ✅ ${n} wallets`);

      // 8. wallet_transactions
      console.log("\n📦 Seeding wallet transactions...");
      const txRows = [
        [TX_1, WALLET_1, 'deposit', 500000],
        [TX_2, WALLET_1, 'withdrawal', 50000],
        [TX_3, WALLET_2, 'commission', 25000],
      ];
      n = 0;
      for (const r of txRows) {
        const res = await query(client,
          `INSERT INTO wallet_transactions (id, wallet_id, transaction_type, amount) VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO NOTHING`,
          r
        );
        if (res && res.rowCount) n++;
      }
      console.log(`  ✅ ${n} wallet transactions`);

      // 9. client_twins
      console.log("\n📦 Seeding client twins...");
      const twinRows = [
        [TWIN_1, CLIENT_SOPHIA, 'Strategic, detail-oriented leader', 'direct and professional', 85],
        [TWIN_2, CLIENT_ELENA, 'Creative, visionary entrepreneur', 'warm and collaborative', 72],
        [TWIN_3, CLIENT_LUXURY, 'Analytical, data-driven operator', 'precise and methodical', 91],
      ];
      n = 0;
      for (const r of twinRows) {
        const res = await query(client,
          `INSERT INTO client_twins (id, client_id, personality_summary, communication_style, engagement_score)
           VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id) DO NOTHING`,
          r
        );
        if (res && res.rowCount) n++;
      }
      console.log(`  ✅ ${n} client twins`);

      // 10. ai_memories
      console.log("\n📦 Seeding AI memories...");
      const memRows2 = [
        [MEMORY_1, 'client', CLIENT_SOPHIA, 'preference', 'Prefers evening consultations', JSON.stringify({ source: 'onboarding' })],
        [MEMORY_2, 'client', CLIENT_ELENA, 'preference', 'Requests vegan meal options', JSON.stringify({ source: 'interaction' })],
        [MEMORY_3, 'client', CLIENT_LUXURY, 'behavior', 'Typically books spa packages', JSON.stringify({ source: 'pattern' })],
        [MEMORY_4, 'user', USER_MARCUS, 'goal', 'Scale to 3 locations by Q4', JSON.stringify({ source: 'onboarding' })],
      ];
      n = 0;
      for (const r of memRows2) {
        const res = await query(client,
          `INSERT INTO ai_memories (id, entity_type, entity_id, memory_type, content, metadata)
           VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (id) DO NOTHING`,
          r
        );
        if (res && res.rowCount) n++;
      }
      console.log(`  ✅ ${n} AI memories`);

      // 11. human_profiles
      console.log("\n📦 Seeding human profiles...");
      const profRows = [
        [PROFILE_1, USER_SOPHIA, 'Sophia', 'Chen', JSON.stringify({ summary: 'High-net-worth wellness entrepreneur' })],
        [PROFILE_2, USER_ELENA, 'Elena', 'Petrova', JSON.stringify({ summary: 'Luxury hospitality executive' })],
        [PROFILE_3, USER_MARCUS, 'Marcus', 'Johnson', JSON.stringify({ summary: 'Creative agency founder' })],
      ];
      n = 0;
      for (const r of profRows) {
        const res = await query(client,
          `INSERT INTO human_profiles (id, user_id, first_name, last_name, identity_summary)
           VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id) DO NOTHING`,
          r
        );
        if (res && res.rowCount) n++;
      }
      console.log(`  ✅ ${n} human profiles`);

      // 12. knowledge_base
      console.log("\n📦 Seeding knowledge base...");
      const kbRows = [
        [KB_1, ORG_ID, 'Luxury Concierge Best Practices', 'VIP client management requires anticipatory service across all touchpoints. Key principles: personalization, exclusivity, discretion.', 'luxury-concierge', null],
        [KB_2, ORG_ID, 'Wellness Industry Trends 2026', 'Personalized AI-driven wellness plans are the top trend. Biohacking, longevity medicine, and mental wellness lead growth.', 'wellness', null],
        [KB_3, ORG_ID, 'Zuri Orchestration Guide', 'Zuri orchestrates across 8 runtimes: n8n, OpenAI, Claude, Gemini, DeepSeek, Ollama, Supabase Edge Functions, and custom webhooks.', 'general', 'technical'],
      ];
      n = 0;
      for (const r of kbRows) {
        const res = await query(client,
          `INSERT INTO knowledge_base (id, org_id, title, content, vertical, specialty)
           VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (id) DO NOTHING`,
          r
        );
        if (res && res.rowCount) n++;
      }
      console.log(`  ✅ ${n} knowledge base articles`);

      // 13. referrals
      console.log("\n📦 Seeding referrals...");
      const refRows = [
        [REFERRAL_1, ORG_ID, null, 'direct', 'Referred by Sophia Chen', 'converted'],
        [REFERRAL_2, ORG_ID, null, 'direct', 'Referred by Elena Petrova', 'pending'],
      ];
      n = 0;
      for (const r of refRows) {
        const res = await query(client,
          `INSERT INTO referrals (id, organization_id, referred_organization_id, referral_type, notes, status)
           VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (id) DO NOTHING`,
          r
        );
        if (res && res.rowCount) n++;
      }
      console.log(`  ✅ ${n} referrals`);

      // 14. usage_metrics
      console.log("\n📦 Seeding usage metrics...");
      const usageRows = [
        [USAGE_1, ORG_ID, 'api_calls', 1250, 'daily'],
        [USAGE_2, ORG_ID, 'agent_executions', 342, 'daily'],
        [USAGE_3, ORG_ID, 'memories_stored', 89, 'daily'],
      ];
      n = 0;
      for (const r of usageRows) {
        const res = await query(client,
          `INSERT INTO usage_metrics (id, organization_id, metric_type, metric_value, billing_period)
           VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id) DO NOTHING`,
          r
        );
        if (res && res.rowCount) n++;
      }
      console.log(`  ✅ ${n} usage metrics`);

      // 15. interactions
      console.log("\n📦 Seeding interactions...");
      const intRows = [
        [INTERACTION_1, ORG_ID, CLIENT_SOPHIA, null, 'chat', 'web', 'Book a spa appointment for Friday', 'I can help with that! Let me check availability.', 'positive'],
        [INTERACTION_2, ORG_ID, CLIENT_ELENA, null, 'voice', 'phone', 'I need a VIP dinner reservation', 'Of course, I will arrange a private dining experience.', 'positive'],
      ];
      n = 0;
      for (const r of intRows) {
        const res = await query(client,
          `INSERT INTO interactions (id, organization_id, client_id, agent_id, interaction_type, channel, input_text, output_text, sentiment)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) ON CONFLICT (id) DO NOTHING`,
          r
        );
        if (res && res.rowCount) n++;
      }
      console.log(`  ✅ ${n} interactions`);

      // 16. notification_logs
      console.log("\n📦 Seeding notification logs...");
      const notifRows = [
        [NOTIFICATION_1, ORG_ID, CLIENT_SOPHIA, 'booking_confirmation', 'email', 'sophia@evolvededen.io', 'Booking Confirmed', 'Your spa appointment is confirmed for Friday at 3pm.', 'delivered'],
        [NOTIFICATION_2, ORG_ID, CLIENT_ELENA, 'welcome', 'email', 'elena@example.com', 'Welcome to Evolved Eden', 'Thank you for joining. Your concierge is ready.', 'delivered'],
      ];
      n = 0;
      for (const r of notifRows) {
        const res = await query(client,
          `INSERT INTO notification_logs (id, organization_id, client_id, notification_type, channel, recipient, subject, message, delivery_status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) ON CONFLICT (id) DO NOTHING`,
          r
        );
        if (res && res.rowCount) n++;
      }
      console.log(`  ✅ ${n} notification logs`);

      // 17. quota_usage
      console.log("\n📦 Seeding quota usage...");
      const qRows = [
        [QUOTA_1, ORG_ID, CLIENT_SOPHIA, 'api_calls', 150, 'monthly'],
      ];
      n = 0;
      for (const r of qRows) {
        const res = await query(client,
          `INSERT INTO quota_usage (id, organization_id, client_id, quota_type, used_amount, usage_window)
           VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (id) DO NOTHING`,
          r
        );
        if (res && res.rowCount) n++;
      }
      console.log(`  ✅ ${n} quota usage`);

      // 18. entitlements
      console.log("\n📦 Seeding entitlements...");
      const entData = [
        { org_id: ORG_ID, feature: 'max_agents', limit_val: 5, src_type: 'tier', src_id: TIER_FOUNDER },
        { org_id: ORG_ID, feature: 'max_swarms', limit_val: 1, src_type: 'tier', src_id: TIER_FOUNDER },
        { org_id: ORG_ID, feature: 'max_workflows', limit_val: 5, src_type: 'tier', src_id: TIER_FOUNDER },
        { org_id: ORG_ID, feature: 'max_agents', limit_val: 15, src_type: 'tier', src_id: TIER_ENTERPRISE },
        { org_id: ORG_ID, feature: 'max_swarms', limit_val: 10, src_type: 'tier', src_id: TIER_ENTERPRISE },
      ];
      n = 0;
      for (const e of entData) {
        const res = await query(client,
          `INSERT INTO entitlements (organization_id, feature_key, is_enabled, limit_value, source_type, source_id)
           SELECT $1::uuid, $2, true, $3, $4, $5::uuid
           WHERE NOT EXISTS (
             SELECT 1 FROM entitlements 
             WHERE organization_id = $1::uuid AND feature_key = $2 AND source_id = $5::uuid
           )`,
          [e.org_id, e.feature, e.limit_val, e.src_type, e.src_id]
        );
        if (res && res.rowCount) n++;
      }
      console.log(`  ✅ ${n} entitlements`);

      // 19. integrations
      console.log("\n📦 Seeding integrations...");
      const intRows2 = [
        [INTEGRATION_1, ORG_ID, 'automation', 'n8n', JSON.stringify({ url: 'https://automation.evolvededen.com' }), 'connected'],
      ];
      n = 0;
      for (const r of intRows2) {
        const res = await query(client,
          `INSERT INTO integrations (id, organization_id, integration_type, provider, credentials, status)
           VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (id) DO NOTHING`,
          r
        );
        if (res && res.rowCount) n++;
      }
      console.log(`  ✅ ${n} integrations`);

      // 20. user_goals
      console.log("\n📦 Seeding user goals...");
      const goalRows = [
        [GOAL_1, CLIENT_SOPHIA, ORG_ID, 'Scale to 3 locations', 'Open two additional wellness studio locations', 'business', 1, false],
        [GOAL_2, CLIENT_ELENA, ORG_ID, 'Launch AI concierge', 'Deploy AI concierge across all hotel properties', 'business', 1, false],
      ];
      n = 0;
      for (const r of goalRows) {
        const res = await query(client,
          `INSERT INTO user_goals (id, client_id, organization_id, title, description, goal_type, priority, is_complete)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT (id) DO NOTHING`,
          r
        );
        if (res && res.rowCount) n++;
      }
      console.log(`  ✅ ${n} user goals`);

      console.log(`\n🎉 Done! Total rows seeded: ${total}`);
      client.release();
      await pool.end();
      return;
    } catch (err) {
      console.log(`${label} failed: ${err.message}`);
      await pool.end().catch(() => {});
    }
  }
}

seed().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
