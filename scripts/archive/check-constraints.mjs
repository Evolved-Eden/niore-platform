import pg from "pg";
const password = process.env.SUPABASE_DB_PASSWORD;
const ref = "jebixydqpvsegvrtfmgm";
const pool = new pg.Pool({
  host: `db.${ref}.supabase.co`, port: 5432, database: "postgres",
  user: "postgres", password, ssl: { rejectUnauthorized: false },
});

async function run() {
  let r;

  r = await pool.query(`
    SELECT conname, pg_get_constraintdef(oid) as def
    FROM pg_catalog.pg_constraint
    WHERE conrelid = 'public.clients'::regclass
  `);
  console.log("=== clients constraints ===");
  r.rows.forEach(x => console.log(`  ${x.conname}: ${x.def}`));

  r = await pool.query(`
    SELECT conname, pg_get_constraintdef(oid) as def
    FROM pg_catalog.pg_constraint
    WHERE conrelid = 'public.onboarding_submissions'::regclass
  `);
  console.log("\n=== onboarding_submissions constraints ===");
  r.rows.forEach(x => console.log(`  ${x.conname}: ${x.def}`));

  r = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'client_type'");
  console.log("\n=== clients.client_type column ===");
  r.rows.forEach(x => console.log(`  ${x.column_name}: ${x.data_type}`));

  r = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'onboarding_submissions' AND column_name = 'status'");
  console.log("\n=== onboarding_submissions.status column ===");
  r.rows.forEach(x => console.log(`  ${x.column_name}: ${x.data_type}`));

  await pool.end();
}
run().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
