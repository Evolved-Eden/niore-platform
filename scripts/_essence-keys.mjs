import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function m() {
  const { data: all } = await s.from('essence_templates').select('*');
  if (!all) { console.log('no data'); process.exit(0); }
  for (const e of all) {
    console.log('=== ' + e.key + ' ===');
    const sj = e.sections_json;
    if (sj) {
      for (const [k, v] of Object.entries(sj)) {
        if (typeof v === 'object' && v !== null) {
          const keyVal = v.key || '(no key)';
          const orderVal = v.order ?? '(no order)';
          const nameVal = v.name || v.title || '';
          const typeVal = v.type || '';
          console.log('  [' + k + '] key="' + keyVal + '" order=' + orderVal + ' name="' + nameVal + '" type="' + typeVal + '"');
        } else {
          console.log('  [' + k + '] = ' + JSON.stringify(v).substring(0, 100));
        }
      }
    }
    console.log('');
  }
  process.exit(0);
}
m().catch(e => { console.error(e); process.exit(1); });
