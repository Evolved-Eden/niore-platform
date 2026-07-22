import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function m() {
  // Use raw query to get blueprint_templates schema
  const { data } = await s.rpc('exec_sql', { query: `
    SELECT column_name, data_type, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'blueprint_templates'
    ORDER BY ordinal_position
  `});
  if (data) {
    console.log('=== BLUEPRINT TEMPLATES SCHEMA ===\n');
    for (const c of data) console.log(c.column_name + ': ' + c.data_type + (c.is_nullable === 'NO' ? ' NOT NULL' : '') + (c.column_default ? ' DEFAULT ' + c.column_default : ''));
  } else {
    console.log('Could not get schema');
    // Try getting a record 
    const { data: bt, error } = await s.from('blueprint_templates').select('*').limit(1);
    if (bt?.length) console.log('Sample row keys: ' + Object.keys(bt[0]).join(', '));
    if (error) console.log(error.message);
  }
  process.exit(0);
}
m().catch(e => { console.error(e); process.exit(1); });
