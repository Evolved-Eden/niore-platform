/**
 * Run Supabase migration for n8n workflow tables
 * 
 * Usage: node scripts/migrate-supabase.mjs
 * Uses env vars: SUPABASE_DB_PASSWORD (or pass as arg)
 */
import pg from "pg";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const sql = readFileSync(join(__dirname, "..", "workflows", "migration.sql"), "utf-8");

// Password from arg or env
const password = process.argv[2] || process.env.SUPABASE_DB_PASSWORD;
if (!password) {
  console.error("❌ Usage: node scripts/migrate-supabase.mjs <db-password>");
  console.error("   Or set SUPABASE_DB_PASSWORD environment variable");
  process.exit(1);
}

const PROJECT_REF = "jebixydqpvsegvrtfmgm";

async function migrate() {
  // Try direct connection first, fall back to pooler
  const hosts = [
    { host: `db.${PROJECT_REF}.supabase.co`, port: 5432, user: "postgres", label: "Direct" },
    { host: `aws-0-us-west-1.pooler.supabase.com`, port: 6543, user: `postgres.${PROJECT_REF}`, label: "Pooler" },
    { host: `${PROJECT_REF}.supabase.co`, port: 5432, user: "postgres", label: "Direct Alt" },
  ];

  for (const { host, port, user, label } of hosts) {
    const pool = new pg.Pool({
      host,
      port,
      database: "postgres",
      user,
      password,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 10000,
    });

    try {
      console.log(`🔌 Connecting via ${label} (${host}:${port})...`);
      const client = await pool.connect();
      console.log(`✅ Connected via ${label}`);

      // Run migration
      console.log("📦 Running migration...");
      await client.query(sql);
      console.log("✅ Migration complete!");
      
      // Verify tables
      const { rows } = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_name IN (
            'workflow_jobs', 'workflow_schedules', 'workflow_dead_letters',
            'workflow_runs', 'workflow_metrics', 'workflow_run_checkpoints'
          )
        ORDER BY table_name
      `);
      console.log("\n📋 Tables created:");
      for (const row of rows) {
        console.log(`  ✅ ${row.table_name}`);
      }

      client.release();
      await pool.end();
      return true;
    } catch (err) {
      console.log(`  ❌ ${label} failed: ${err.message}`);
      await pool.end().catch(() => {});
    }
  }

  console.error("\n❌ All connection methods failed");
  return false;
}

migrate().then((ok) => process.exit(ok ? 0 : 1));
