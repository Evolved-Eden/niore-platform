import pg from "pg";
const ref = "jebixydqpvsegvrtfmgm";
const pass = process.env.SUPABASE_DB_PASSWORD;

const configs = [
  { host: `${ref}.pooler.supabase.com`, port: 6543, user: `postgres.${ref}`, database: "postgres", password: pass, label: "Project pooler tx" },
  { host: `${ref}.pooler.supabase.com`, port: 5432, user: `postgres.${ref}`, database: "postgres", password: pass, label: "Project pooler session" },
  { host: "aws-0-us-west-1.pooler.supabase.com", port: 6543, user: `postgres.${ref}`, database: "postgres", password: pass, label: "Regional pooler tx" },
  { host: "aws-0-us-west-1.pooler.supabase.com", port: 5432, user: `postgres.${ref}`, database: "postgres", password: pass, label: "Regional pooler session" },
  { host: `${ref}.pooler.supabase.com`, port: 6543, user: "postgres", database: "postgres", password: pass, label: "Project pooler tx (postgres)" },
  { host: `db.${ref}.supabase.co`, port: 5432, user: "postgres", database: "postgres", password: pass, label: "Direct IPv6" },
];

for (const cfg of configs) {
  const pool = new pg.Pool({ host: cfg.host, port: cfg.port, user: cfg.user, database: cfg.database, password: cfg.password, max: 1, connectionTimeoutMillis: 8000 });
  try {
    const r = await pool.query("SELECT 1 as ok");
    console.log(`✅ ${cfg.label}: ${cfg.host}:${cfg.port} as ${cfg.user}`);
    await pool.end();
    break;
  } catch(e) {
    console.log(`❌ ${cfg.label}: ${e.message.slice(0,80)}`);
    await pool.end();
  }
}
