require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  // Get OS type UUID
  const { data: osType } = await supabase.from('catalog_types').select('id').eq('key', 'os_system').single();
  const { data: memType } = await supabase.from('catalog_types').select('id').eq('key', 'membership_subscription').single();
  
  if (osType) {
    const { data: osItems } = await supabase.from('catalog_items').select('id, name, slug, base_price, currency').eq('catalog_type_id', osType.id);
    console.log('=== OS SYSTEMS ===');
    osItems.forEach(i => console.log(i.id + ' | ' + i.name + ' | slug=' + i.slug + ' | base_price=' + i.base_price + ' ' + (i.currency||'USD')));
  }
  
  if (memType) {
    const { data: memItems } = await supabase.from('catalog_items').select('id, name, slug, base_price, currency').eq('catalog_type_id', memType.id);
    console.log('\n=== MEMBERSHIPS ===');
    memItems.forEach(i => console.log(i.id + ' | ' + i.name + ' | slug=' + i.slug + ' | base_price=' + i.base_price + ' ' + (i.currency||'USD')));
  }
  
  // Check catalog_pricing for OS and membership items
  if (osType) {
    const { data: items } = await supabase.from('catalog_items').select('id, name').eq('catalog_type_id', osType.id);
    for (const item of items.slice(0,3)) {
      const { data: pricing } = await supabase.from('catalog_pricing').select('*').eq('catalog_item_id', item.id);
      if (pricing && pricing.length > 0) {
        console.log('\n' + item.name + ' pricing:');
        pricing.forEach(p => console.log('  ' + p.billing_type + ' | ' + p.price + ' ' + p.currency + ' | interval=' + p.billing_interval));
      }
    }
  }
}
check().catch(console.error);
