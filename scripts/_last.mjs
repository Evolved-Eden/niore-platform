import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function m() {
  const { data } = await s.from('omnigrid_intelligence_system').select('system_number,slug,name,domain_key,lens_key,tagline,description').order('system_number');
  if (!data) return;

  // Show #188-192
  console.log('=== SYSTEMS #188-192 ===\n');
  for (const d of data) {
    if (d.system_number >= 188) console.log('#' + d.system_number + ' ' + d.slug + ': "' + d.name + '" — domain: ' + d.domain_key + ' | tagline: ' + (d.tagline ? 'YES' : 'NO') + ' | desc: ' + (d.description ? 'YES' : 'NO'));
  }

  // Check system 1 gap
  const nums = data.map(d => d.system_number).sort((a,b) => a-b);
  const gaps = [];
  for (let i = 1; i <= nums[nums.length-1]; i++) { if (!nums.includes(i)) gaps.push(i); }
  if (gaps.length) console.log('\n=== NUMBER GAPS: ' + gaps.join(', '));
  else console.log('\n=== NO NUMBER GAPS ===');

  // Show complete list of all 191 systems with tagline/desc status
  console.log('\n=== FULL SYSTEM LIST ===\n');
  for (const d of data) {
    const missing = [];
    if (!d.tagline) missing.push('T');
    if (!d.description) missing.push('D');
    const flag = missing.length ? '⚠️' + missing.join('') : '✅';
    console.log(flag + ' #' + String(d.system_number).padStart(3) + ' ' + d.slug.padEnd(35) + ' ' + d.domain_key.padEnd(25) + ' "' + d.name + '"');
  }

  process.exit(0);
}
m().catch(e => { console.error(e); process.exit(1); });
