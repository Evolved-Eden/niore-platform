require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  // Get all types as a map
  const { data: types } = await supabase.from('catalog_types').select('id, key, name');
  if (!types) { console.log('no types'); return; }
  const typeMap = {};
  types.forEach(t => typeMap[t.key] = t.id);
  console.log('Type keys:', Object.keys(typeMap).join(', '));
  
  const osId = typeMap['os_system'];
  const memId = typeMap['membership_subscription'];
  
  if (osId) {
    const { data: items } = await supabase.from('catalog_items').select('id, name, slug, base_price, currency').eq('catalog_type_id', osId);
    console.log('\nOS SYSTEMS (' + items.length + '):');
    items.forEach(i => console.log(i.id.slice(0,8) + ' | ' + i.name + ' | slug=' + i.slug + ' | price=' + i.base_price + ' ' + (i.currency||'USD')));
  } else {
    console.log('os_system type not found');
  }
  
  if (memId) {
    const { data: items } = await supabase.from('catalog_items').select('id, name, slug, base_price, currency').eq('catalog_type_id', memId);
    console.log('\nMEMBERSHIPS (' + items.length + '):');
    items.forEach(i => console.log(i.id.slice(0,8) + ' | ' + i.name + ' | slug=' + i.slug + ' | price=' + i.base_price + ' ' + (i.currency||'USD')));
  } else {
    console.log('membership_subscription type not found');
  }
  
  // Get catalog pricing for any items
  const { data: cp } = await supabase.from('catalog_pricing').select('*').limit(5);
  if (cp && cp.length) {
    console.log('\nSample catalog_pricing:');
    cp.forEach(p => console.log('  item=' + p.catalog_item_id.slice(0,8) + ' | price=' + p.price + ' | type=' + p.billing_type + ' | interval=' + p.billing_interval));
  }
}
main().catch(e => console.log('ERROR:', e.message));
