import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function m() {
  const { data: et } = await s.from('essence_templates').select('key, sections_json, system_mapping, required_system_keys, optional_system_keys, connections').in('key', ['standard_essence','premium_essence','concierge_essence']);
  if (!et) { console.log('no data'); process.exit(0); }
  for (const e of et) {
    console.log('=== ' + e.key + ' ===');
    console.log('SECTIONS:');
    console.log(JSON.stringify(e.sections_json));
    if (e.system_mapping) console.log('SYSTEM_MAP: ' + JSON.stringify(e.system_mapping));
    if (e.required_system_keys) console.log('REQ_SYS: ' + JSON.stringify(e.required_system_keys));
    if (e.optional_system_keys) console.log('OPT_SYS: ' + JSON.stringify(e.optional_system_keys));
    if (e.connections) console.log('CONNECTIONS: ' + JSON.stringify(e.connections));
    console.log('');
  }
  process.exit(0);
}
m().catch(e => { console.error(e); process.exit(1); });
