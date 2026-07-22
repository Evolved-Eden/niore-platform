import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  // Check catalog_items
  const { data: items } = await s.from('catalog_items').select('*').limit(5);
  console.log('catalog_items:', items ? items.length : 'null');

  const { data: cats } = await s.from('categories').select('*').limit(20);
  console.log('categories:', cats ? cats.length : 'null', cats ? cats.map(c => `${c.key} (${c.name})`).join(', ') : '');

  // Check service role key works
  const { data: test } = await s.from('pricing_plans').select('id').limit(1);
  console.log('pricing_plans:', test ? test.length : 'null');

  // Check what tables exist via raw SQL
  const { data: tables, error } = await s.rpc('get_tables');
  console.log('get_tables rpc:', tables ? tables.length : 'null', error ? error.message : '');

  process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });
