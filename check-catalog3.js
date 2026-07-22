require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data: items, error } = await supabase.from('catalog_items').select('id, name, slug, catalog_type_id, price, status, metadata').order('name');
  if (error) { console.log('Error:', error.message); return; }
  console.log('=== ALL ' + items.length + ' CATALOG ITEMS ===');
  
  // Group by type
  const byType = {};
  for (const i of items) {
    const t = i.catalog_type_id || 'unknown';
    if (!byType[t]) byType[t] = [];
    byType[t].push(i.name + ' ($' + (i.price||0) + ')');
  }
  
  for (const [type, names] of Object.entries(byType)) {
    console.log('\n--- ' + type + ' (' + names.length + ') ---');
    names.forEach(n => console.log('  ' + n));
  }
  
  // Print all catalog types
  const { data: types } = await supabase.from('catalog_types').select('key, name');
  if (types) {
    console.log('\n=== CATALOG TYPES ===');
    types.forEach(t => console.log(t.key + ' = ' + t.name));
  }
}
check().catch(console.error);
