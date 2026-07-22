require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  // All catalog items
  const { data: items } = await supabase.from('catalog_items').select('id, name, slug, catalog_type_id, price, status, metadata').order('name');
  if (items) {
    console.log('=== ALL ' + items.length + ' CATALOG ITEMS ===');
    items.forEach(i => console.log(i.id + ' | ' + i.name + ' | type=' + (i.catalog_type_id||"null") + ' | price=' + (i.price||"null") + ' | status=' + i.status));
  }
  
  // Check catalog_pricing table
  const { data: pricing } = await supabase.from('catalog_pricing').select('*').limit(10);
  if (pricing) console.log('\ncatalog_pricing (' + pricing.length + '):', JSON.stringify(pricing[0], null, 2));
  else console.log('\ncatalog_pricing: no data or error');

  // Check catalog_item_links
  const { data: links } = await supabase.from('catalog_item_links').select('*').limit(5);
  if (links) console.log('\ncatalog_item_links:', links.length + ' rows');
  else console.log('\ncatalog_item_links: error');

  // Check catalog_purchases
  const { data: purchases } = await supabase.from('catalog_purchases').select('*').limit(5);
  if (purchases) console.log('\ncatalog_purchases:', purchases.length + ' rows');
  else console.log('\ncatalog_purchases: error');
}
check().catch(console.error);
