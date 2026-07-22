require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data: items, error } = await supabase.from('catalog_items').select('id, name, slug, catalog_type_id, status').order('name');
  if (error) { console.log('Error:', error.message); return; }
  console.log('=== ALL ' + items.length + ' CATALOG ITEMS ===');
  
  const byType = {};
  for (const i of items) {
    const t = i.catalog_type_id || 'unknown';
    if (!byType[t]) byType[t] = [];
    byType[t].push(i.name);
  }
  for (const [type, names] of Object.entries(byType)) {
    console.log('\n--- ' + type + ' (' + names.length + ') ---');
    names.forEach(n => console.log('  ' + n));
  }
  
  // Get all catalog types by key
  const { data: typeRefs } = await supabase.from('catalog_types').select('id, key, name');
  if (typeRefs) {
    console.log('\n=== TYPE ID TO KEY MAP ===');
    typeRefs.forEach(t => console.log(t.id + ' = ' + t.name + ' (' + t.key + ')'));
  }
}
check().catch(console.error);
