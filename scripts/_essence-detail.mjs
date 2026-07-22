import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function m() {
  // Show full sections_json for key templates
  const { data: et } = await s.from('essence_templates').select('key, sections_json, system_mapping, required_system_keys, optional_system_keys').in('key', ['standard_essence', 'premium_essence', 'concierge_essence']);
  for (const e of et || []) {
    console.log('=== ' + e.key + ' ===');
    console.log('sections_json:');
    console.log(JSON.stringify(e.sections_json, null, 2));
    if (e.system_mapping) console.log('\nsystem_mapping: ' + JSON.stringify(e.system_mapping, null, 2));
    if (e.required_system_keys) console.log('\nrequired_systems: ' + JSON.stringify(e.required_system_keys));
    if (e.optional_system_keys) console.log('\noptional_systems: ' + JSON.stringify(e.optional_system_keys));
    console.log('\n');
  }
  process.exit(0);
}
m().catch(e => { console.error(e); process.exit(1); });
