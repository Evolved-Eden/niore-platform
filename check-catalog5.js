require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  // Just get raw data without type checking
  const { data: items } = await supabase.from('catalog_items').select('*').limit(3);
  if (items) console.log('Sample columns:', Object.keys(items[0]).join(', '));
  
  // Get count by type
  const { data: types } = await supabase.from('catalog_types').select('id, name');
  if (types) {
    console.log('\nTypes:');
    for (const t of types) {
      const { count } = await supabase.from('catalog_items').select('*', { count: 'exact', head: true }).eq('catalog_type_id', t.id);
      console.log('  ' + t.name + ' (' + t.id + '): ' + count + ' items');
    }
  }
  
  // OS-type items
  const { data: osTypes } = await supabase.from('catalog_types').select('*');
  if (osTypes) {
    console.log('\nAll types with detailed:');
    for (const t of osTypes) {
      const { data: items } = await supabase.from('catalog_items').select('name').eq('catalog_type_id', t.id).limit(10);
      if (items && items.length > 0) {
        console.log('  ' + t.name + ': ' + items.map(i => i.name).join(', '));
      }
    }
  }
}
check().catch(console.error);
