import pg from "pg";
const password = process.env.SUPABASE_DB_PASSWORD;
const PROJECT_REF = "jebixydqpvsegvrtfmgm";

const pool = new pg.Pool({
  host: `db.${PROJECT_REF}.supabase.co`,
  port: 5432,
  database: "postgres",
  user: "postgres",
  password,
  ssl: { rejectUnauthorized: false },
});

async function run() {
  let r;

  r = await pool.query("SELECT id, key, name FROM membership_tiers ORDER BY key");
  console.log("=== membership_tiers ===");
  r.rows.forEach(x => console.log(`  ${x.id} | ${x.key} | ${x.name}`));

  r = await pool.query("SELECT id, name, slug FROM organizations WHERE slug = 'zuri-demo'");
  console.log("\n=== organization (zuri-demo) ===");
  r.rows.forEach(x => console.log(`  id=${x.id} name=${x.name}`));

  r = await pool.query("SELECT id, name, slug, organization_id FROM businesses LIMIT 3");
  console.log("\n=== businesses ===");
  r.rows.forEach(x => console.log(`  ${x.id} | ${x.name} | org=${x.organization_id}`));

  r = await pool.query("SELECT id, key, name FROM verticals LIMIT 10");
  console.log("\n=== verticals ===");
  r.rows.forEach(x => console.log(`  ${x.id.substring(0,8)} | ${x.key} | ${x.name}`));

  r = await pool.query("SELECT slug, name, is_master, canonical_template FROM canonical_agent_map LIMIT 10");
  console.log("\n=== canonical_agent_map ===");
  r.rows.forEach(x => console.log(`  ${x.slug} | ${x.name} | master=${x.is_master} | template=${x.canonical_template}`));

  r = await pool.query("SELECT id, key, name FROM agent_types ORDER BY category LIMIT 15");
  console.log("\n=== agent_types ===");
  r.rows.forEach(x => console.log(`  ${x.id.substring(0,8)} | ${x.key} | ${x.name}`));

  await pool.end();
}
run().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
