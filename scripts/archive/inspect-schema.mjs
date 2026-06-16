import pg from "pg";

const PROJECT_REF = "jebixydqpvsegvrtfmgm";
const password = process.argv[2] || process.env.SUPABASE_DB_PASSWORD;
if (!password) { console.error("Need DB password"); process.exit(1); }

const tables = [
  'memberships', 'clients', 'users', 'identities', 'onboarding_submissions',
  'payments', 'wallets', 'wallet_transactions', 'ai_memories', 'memories',
  'client_twins', 'intelligence_profiles', 'human_profiles', 'profile_snapshots',
  'entitlements', 'usage_metrics', 'knowledge_base', 'branding',
  'referrals', 'interactions', 'quota_usage', 'integrations',
  'agent_deployments', 'notification_logs', 'user_goals',
  'omnigrid_intelligence_system', 'resonance_signals'
];

const hosts = [
  { host: `db.${PROJECT_REF}.supabase.co`, port: 5432, user: "postgres", label: "Direct" },
  { host: `aws-0-us-west-1.pooler.supabase.com`, port: 6543, user: `postgres.${PROJECT_REF}`, label: "Pooler" },
];

async function run() {
  for (const { host, port, user, label } of hosts) {
    const pool = new pg.Pool({
      host, port, database: "postgres", user, password,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 10000,
    });
    try {
      const client = await pool.connect();
      const { rows } = await client.query(`
        SELECT table_name, column_name, data_type, is_nullable, 
               coalesce(column_default, '') as default_val,
               ordinal_position
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name IN (${tables.map(t => "'" + t + "'").join(',')})
        ORDER BY table_name, ordinal_position
      `);
      
      const groups = {};
      for (const r of rows) {
        if (!groups[r.table_name]) groups[r.table_name] = [];
        groups[r.table_name].push(r);
      }
      
      for (const tbl of Object.keys(groups).sort()) {
        console.log(`=== ${tbl} ===`);
        for (const c of groups[tbl]) {
          console.log(`  ${c.column_name}: ${c.data_type}${c.is_nullable === 'NO' ? ' NOT NULL' : ''}${c.default_val ? ' DEFAULT ' + c.default_val.substring(0, 60) : ''}`);
        }
        console.log('');
      }
      
      client.release();
      await pool.end();
      return;
    } catch (err) {
      console.log(`${label} failed: ${err.message}`);
      await pool.end().catch(() => {});
    }
  }
}

run().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
