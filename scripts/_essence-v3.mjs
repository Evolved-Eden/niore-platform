import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function m() {
  const { data: all } = await s.from('essence_templates').select('*');
  if (!all) { console.log('no data'); process.exit(0); }

  for (const e of all) {
    console.log('=== ' + e.key + ' ===');
    console.log('  name: ' + e.name);
    console.log('  description: ' + (e.description || ''));
    console.log('  vertical_id: ' + (e.vertical_id || ''));
    console.log('  vertical_key: ' + (e.vertical_key || ''));
    console.log('  is_active: ' + e.is_active);
    const sj = e.sections_json;
    if (sj && typeof sj === 'object') {
      const keys = Object.keys(sj);
      console.log('  sections: [' + keys.join(', ') + ']');
      for (const k of keys) {
        const v = sj[k];
        let label = '';
        if (typeof v === 'object' && v !== null) {
          if (v.name) label = v.name;
          else if (v.title) label = v.title;
          else label = Object.keys(v).join(', ');
        } else if (typeof v === 'string') {
          label = v.substring(0, 80);
        }
        const hasProfile = JSON.stringify(v).toLowerCase().includes('profile');
        console.log('    [' + k + '] ' + label + (hasProfile ? ' ⚠️PROFILE' : ''));
      }
    }
    const tj = e.template_json;
    if (tj && typeof tj === 'object' && Object.keys(tj).length) {
      console.log('  template_json keys: ' + Object.keys(tj).join(', '));
    }
    console.log('');
  }
  process.exit(0);
}
m().catch(e => { console.error(e); process.exit(1); });
