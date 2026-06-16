const {Pool}=require('pg');
const p = new Pool({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false }
});
(async()=>{
  // Find generator tables
  const tables = await p.query("SELECT table_name FROM information_schema.tables WHERE table_name LIKE '%generator%' AND table_schema='public'");
  console.log('=== GENERATOR TABLES ===');
  for (const t of tables.rows) {
    console.log(`\n--- ${t.table_name} ---`);
    const cols = await p.query(`SELECT column_name,data_type,is_nullable,column_default FROM information_schema.columns WHERE table_name='${t.table_name}' ORDER BY ordinal_position`);
    cols.rows.forEach(c=>console.log(`  ${c.column_name}: ${c.data_type}  nullable=${c.is_nullable}  default=${c.column_default||'-'}`));
    const cnt = await p.query(`SELECT count(*) as c FROM "${t.table_name}"`);
    console.log(`  Rows: ${cnt.rows[0].c}`);
    if (cnt.rows[0].c > 0 && cnt.rows[0].c < 20) {
      const data = await p.query(`SELECT * FROM "${t.table_name}" LIMIT 20`);
      data.rows.forEach(r=>console.log('  ', JSON.stringify(r)));
    }
  }

  // Also check templates table
  console.log('\n=== TEMPLATES TABLE ===');
  const tCols = await p.query("SELECT column_name,data_type,is_nullable FROM information_schema.columns WHERE table_name='templates' ORDER BY ordinal_position");
  if (tCols.rows.length) tCols.rows.forEach(c=>console.log(`  ${c.column_name}: ${c.data_type}  nullable=${c.is_nullable}`));
  else console.log('  (not found)');
  const tCnt = await p.query("SELECT count(*) as c FROM templates");
  if (tCnt.rows.length) console.log(`  Rows: ${tCnt.rows[0].c}`);

  // List all template-related tables
  console.log('\n=== ALL TEMPLATE TABLES ===');
  const tt = await p.query("SELECT table_name FROM information_schema.tables WHERE table_name LIKE '%template%' AND table_schema='public'");
  tt.rows.forEach(r=>console.log(' ', r.table_name));

  await p.end();
})();
