import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function m() {
  const { data } = await s.from('omnigrid_intelligence_system').select('system_number,slug,name,tagline,description,domain_key,lens_key').order('system_number');
  if (!data) return;

  const missing = data.filter(x => !x.tagline || !x.description);
  console.log('=== MISSING TAGLINE/DESCRIPTION (' + missing.length + ') ===\n');
  for (const m of missing) {
    console.log('#' + m.system_number + ' ' + m.slug + ': "' + m.name + '"');
    console.log('  domain: ' + m.domain_key + ' | lens: ' + m.lens_key);
    if (!m.tagline) console.log('  ⚠️ MISSING tagline');
    if (!m.description) console.log('  ⚠️ MISSING description');
  }

  const domains = {};
  for (const d of data) {
    if (!domains[d.domain_key]) domains[d.domain_key] = { count: 0, items: [] };
    domains[d.domain_key].count++;
    domains[d.domain_key].items.push('#' + d.system_number);
  }
  console.log('\n=== DOMAINS (' + Object.keys(domains).length + ') ===\n');
  for (const [k, v] of Object.entries(domains)) {
    console.log(k + ': ' + v.count + ' systems — ' + v.items[0] + ' to ' + v.items[v.items.length - 1]);
  }

  const lenses = {};
  for (const d of data) {
    if (!lenses[d.lens_key]) lenses[d.lens_key] = 0;
    lenses[d.lens_key]++;
  }
  console.log('\n=== LENSES ===\n');
  for (const [k, v] of Object.entries(lenses)) {
    console.log(k + ': ' + v + ' systems');
  }

  // Show a few sample systems per domain
  console.log('\n=== SAMPLE SYSTEMS PER DOMAIN ===\n');
  for (const [dom, info] of Object.entries(domains)) {
    const samples = data.filter(d => d.domain_key === dom).slice(0, 3);
    console.log(dom + ': ' + samples.map(s => '#' + s.system_number + ' ' + s.slug).join(', '));
  }

  process.exit(0);
}
m().catch(e => { console.error(e); process.exit(1); });
