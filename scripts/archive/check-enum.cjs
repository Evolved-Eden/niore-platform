const {Pool}=require('pg');
const p = new Pool({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false }
});
(async()=>{
  // Check the enum type for organization_members.role
  const r=await p.query(`
    SELECT udt_name, udt_schema, data_type 
    FROM information_schema.columns 
    WHERE table_name='organization_members' AND column_name='role'
  `);
  console.log('Role column type:', r.rows[0]);
  
  // List all enums
  const enums=await p.query(`
    SELECT t.typname as enum_name, e.enumlabel as enum_value
    FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    ORDER BY t.typname, e.enumsortorder
  `);
  console.log('\nAll enums:');
  let currentEnum='';
  for (const row of enums.rows) {
    if (row.enum_name !== currentEnum) {
      console.log(`\n${row.enum_name}:`);
      currentEnum = row.enum_name;
    }
    console.log(`  - ${row.enum_value}`);
  }
  await p.end();
})();
