import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function m() {
  // Essence templates — full structure
  const { data: et } = await s.from('essence_templates').select('*').order('key');
  console.log('=== ESSENCE TEMPLATES ===\n');
  for (const e of et || []) {
    console.log('--- ' + e.key + ' ---');
    console.log('  name: ' + e.name);
    console.log('  blueprint_key: ' + (e.blueprint_key || 'none'));
    console.log('  lens_key: ' + (e.lens_key || 'none'));
    console.log('  description: ' + (e.description || '(none)'));
    if (e.sections_json) {
      console.log('  sections_json keys: ' + Object.keys(e.sections_json).join(', '));
      // Check for "profile" references
      const str = JSON.stringify(e.sections_json).toLowerCase();
      if (str.includes('profile')) console.log('  ⚠️ CONTAINS "profile" REFERENCE');
    }
    if (e.required_system_keys) console.log('  required_systems: ' + JSON.stringify(e.required_system_keys));
    if (e.optional_system_keys) console.log('  optional_systems: ' + JSON.stringify(e.optional_system_keys));
    if (e.system_mapping) console.log('  system_mapping keys: ' + Object.keys(e.system_mapping).join(', '));
    if (e.connections) console.log('  connections: ' + JSON.stringify(e.connections));
    console.log('');
  }

  // Blueprint templates structure
  const { data: cols } = await s.rpc('exec_sql', { query: "SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'blueprint_templates' ORDER BY ordinal_position" });
  if (cols) {
    console.log('=== BLUEPRINT TEMPLATES SCHEMA ===\n');
    for (const c of cols) console.log('  ' + c.column_name + ' (' + c.data_type + ', nullable=' + c.is_nullable + ')');
  }

  process.exit(0);
}
m().catch(e => { console.error(e); process.exit(1); });
