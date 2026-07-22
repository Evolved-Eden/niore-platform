import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function m() {
  const { data: all, error } = await s.from('essence_templates').select('key, name, sections_json, system_mapping, required_system_keys, optional_system_keys, connections, lens_key, blueprint_key');
  if (error) { console.log('ERR: ' + error.message); process.exit(1); }
  if (!all) { console.log('no data'); process.exit(0); }

  for (const e of all) {
    console.log('=== ' + e.key + ' ===');
    const sj = e.sections_json;
    if (sj && typeof sj === 'object') {
      for (const [k, v] of Object.entries(sj)) {
        const vstr = JSON.stringify(v);
        const hasProfile = vstr.toLowerCase().includes('profile');
        console.log('  section[' + k + ']: ' + (typeof v === 'object' ? Object.keys(v).join(', ') : vstr.substring(0, 120)) + (hasProfile ? ' ⚠️PROFILE' : ''));
      }
    }
    console.log('  lens_key: ' + (e.lens_key || 'none'));
    console.log('  blueprint_key: ' + (e.blueprint_key || 'none'));
    if (e.system_mapping) console.log('  sys_map: ' + JSON.stringify(e.system_mapping).substring(0, 200));
    if (e.required_system_keys) console.log('  req_sys: ' + e.required_system_keys.join(', '));
    if (e.optional_system_keys) console.log('  opt_sys: ' + e.optional_system_keys.join(', '));
    if (e.connections) console.log('  conns: ' + JSON.stringify(e.connections));
    console.log('');
  }
  process.exit(0);
}
m().catch(e => { console.error(e); process.exit(1); });
