const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
  const checks = ['clients', 'catalog_items', 'ie_listings', 'membership_tiers', 'organizations', 'users', 'catalogs'];
  for (const table of checks) {
    const { count, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });
    if (error) {
      console.log(table + ': ERROR - ' + error.message);
    } else {
      console.log(table + ': ' + count + ' rows');
    }
  }
}
check().catch(console.error);
