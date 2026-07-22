require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  // Get catalog types and categories
  const { data: types } = await supabase.from('catalog_types').select('*');
  if (types) console.log('catalog_types:', types.map(t => t.name + ' (' + t.key + ')').join(', '));

  const { data: cats } = await supabase.from('catalog_categories').select('*');
  if (cats) console.log('catalog_categories:', cats.map(c => c.name + ' (' + c.key + ')').join(', '));

  // Get catalog items (first 20)
  const { data: items } = await supabase.from('catalog_items').select('id, name, catalog_type_id, price, organization_id').limit(20);
  if (items) console.log('\nFirst 20 catalog_items:');
  if (items) items.forEach(i => console.log('  ' + i.name + ' | type: ' + i.catalog_type_id + ' | price: ' + i.price + ' | org: ' + (i.organization_id || 'null')));

  // Get catalogs
  const { data: catalogs } = await supabase.from('catalogs').select('*');
  if (catalogs) console.log('\ncatalogs:');
  if (catalogs) catalogs.forEach(c => console.log('  ' + c.name + ' (' + c.key + ') kind=' + c.kind));

  // Get membership tiers
  const { data: tiers } = await supabase.from('membership_tiers').select('key, name, category, billing_interval, price_range').limit(30);
  if (tiers) console.log('\nmembership_tiers:');
  if (tiers) tiers.forEach(t => console.log('  ' + t.key + ' | ' + t.name + ' | cat=' + t.category + ' | interval=' + t.billing_interval + ' | price=' + t.price_range));

  // Get ie_listings categories
  const { data: ieCats } = await supabase.from('ie_categories').select('*');
  if (ieCats) console.log('\nie_categories:', ieCats.map(c => c.name).join(', '));

  // Get ie_listings
  const { data: listings } = await supabase.from('ie_listings').select('id, title, category_id, price_label, author').limit(20);
  if (listings) console.log('\nie_listings:');
  if (listings) listings.forEach(l => console.log('  ' + l.title + ' | ' + l.price_label + ' | by ' + l.author));
}
check().catch(console.error);
