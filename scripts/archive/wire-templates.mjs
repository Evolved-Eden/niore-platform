import pg from 'pg';
const pool = new pg.Pool({
  host: 'db.jebixydqpvsegvrtfmgm.supabase.co', port: 5432, database: 'postgres',
  user: 'postgres', password: process.argv[2],
  ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 15000,
});

// Vertical → best-matching template mapping
const vertToBlueprint = {
  hospitality: 'lux_hotel_blueprint',
  luxury: 'lux_hotel_blueprint',
  real_estate: 'lux_realtor_blueprint',
  health: 'lux_medspa_blueprint',
  wellness: 'lux_medspa_blueprint',
  mental_health: 'lux_medspa_blueprint',
  beauty: 'lux_medspa_blueprint',
  // Everything else → tiered intake (based on agent count/importance)
};

const vertToEssence = {
  hospitality: 'luxury_hotel_essence',
  luxury: 'luxury_client_essence',
  real_estate: 'luxury_real_estate_client_essence',
  health: 'luxury_medspa_essence',
  wellness: 'wellness_client_essence',
  mental_health: 'luxury_medspa_essence',
  beauty: 'luxury_medspa_essence',
};

// Default tiers by agent count (higher count = higher tier)
const tierMap = {
  core: 'premium', corporate: 'premium', real_estate: 'luxe',
  legal: 'premium', finance: 'premium', tech: 'premium',
  health: 'luxe', hospitality: 'luxe', luxury: 'luxe',
  government: 'standard', crisis: 'premium', social_services: 'standard',
  education: 'standard', media: 'premium', creator: 'concierge',
  ai: 'premium', manufacturing: 'standard', commerce: 'concierge',
};

const tierToBlueprint = { standard: 'standard_intake_blueprint', premium: 'premium_intake_blueprint', concierge: 'concierge_intake_blueprint', luxe: 'luxe_intake_blueprint' };
const tierToEssence = { standard: 'standard_essence', premium: 'premium_essence', concierge: 'concierge_essence', luxe: 'luxe_essence' };

let wired = 0;
const {rows: agents} = await pool.query("SELECT id, vertical, primary_template, secondary_template FROM agents");

for (const a of agents) {
  if (a.primary_template && a.secondary_template) continue;
  
  const vert = a.vertical || 'general';
  let primary = a.primary_template;
  let secondary = a.secondary_template;
  
  // Try specific mapping first
  if (!primary) {
    primary = vertToBlueprint[vert] || tierToBlueprint[tierMap[vert]] || 'standard_intake_blueprint';
  }
  if (!secondary) {
    secondary = vertToEssence[vert] || tierToEssence[tierMap[vert]] || 'standard_essence';
  }
  
  await pool.query(
    "UPDATE agents SET primary_template = $1, secondary_template = $2 WHERE id = $3 AND (primary_template IS NULL OR secondary_template IS NULL)",
    [primary, secondary, a.id]
  );
  wired++;
}

console.log(`Wired ${wired} agents to templates`);

// Verify
const {rows: check} = await pool.query(`
  SELECT primary_template, secondary_template, count(*)::int as cnt 
  FROM agents GROUP BY primary_template, secondary_template ORDER BY cnt DESC
`);
console.log('\nTemplate distribution:');
for (const c of check) console.log(`  ${(c.primary_template||'NULL').padEnd(35)} ${(c.secondary_template||'NULL').padEnd(35)} count=${c.cnt}`);

await pool.end();
