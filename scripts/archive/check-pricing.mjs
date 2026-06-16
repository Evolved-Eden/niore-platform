import pg from 'pg';
const pool = new pg.Pool({
  host: 'db.jebixydqpvsegvrtfmgm.supabase.co', port: 5432, database: 'postgres',
  user: 'postgres', password: process.argv[2],
  ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 15000,
});

// Find all tables related to pricing, subscriptions, memberships, tiers
const {rows: tables} = await pool.query(`
  SELECT table_name FROM information_schema.tables 
  WHERE table_schema='public' AND table_type='BASE TABLE'
  ORDER BY table_name
`);
console.log(`Total tables: ${tables.length}`);

// Filter for relevant ones
const relevant = tables.filter(t => 
  /pricing|subscription|plan|tier|entitlement|stripe|member|billing|invoice|payment|coupon|order/i.test(t.table_name)
);
console.log('\nRelevant tables:');
for (const t of relevant) {
  const {rows: cols} = await pool.query(
    "SELECT column_name, data_type FROM information_schema.columns WHERE table_name=$1 ORDER BY ordinal_position",
    [t.table_name]
  );
  const {rows: cnt} = await pool.query(`SELECT COUNT(*)::int as c FROM ${t.table_name}`);
  console.log(`  ${t.table_name.padEnd(35)} ${String(cnt[0].c).padStart(4)} rows  cols: ${cols.map(c => c.column_name).join(', ')}`);
}

// Check if membership_tiers or tier_entitlements exist
const {rows: mtCheck} = await pool.query(`
  SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name='membership_tiers') as has_mt,
         EXISTS (SELECT FROM information_schema.tables WHERE table_name='tier_entitlements') as has_te
`);
console.log('\nMembership tiers table exists:', mtCheck[0].has_mt);
console.log('Tier entitlements table exists:', mtCheck[0].has_te);

// Check Stripe connection status
const {rows: stripeCheck} = await pool.query(`
  SELECT column_name FROM information_schema.columns 
  WHERE table_name='app_settings' OR table_name='system_config'
  LIMIT 5
`);
console.log('\nApp settings columns:', stripeCheck.map(c => c.column_name));

await pool.end();
