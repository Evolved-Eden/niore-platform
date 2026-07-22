import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function m() {
  const { data: ois } = await s.from('omnigrid_intelligence_system').select('*').order('system_number');
  console.log('OMNIGRID SYSTEMS: ' + (ois?.length || 0));
  if (ois?.length) {
    // show min/max system_number
    const nums = ois.map(o => o.system_number).sort((a,b) => a-b);
    console.log('  Range: ' + nums[0] + ' to ' + nums[nums.length-1]);
    // show domains used
    const domains = [...new Set(ois.map(o => o.domain_key || '?'))];
    console.log('  Domains: ' + domains.join(', '));
    // check for missing fields
    let missingTagline = 0, missingDesc = 0, missingDomain = 0, missingLens = 0;
    for (const o of ois) {
      if (!o.tagline) missingTagline++;
      if (!o.description) missingDesc++;
      if (!o.domain_key) missingDomain++;
      if (!o.lens_key) missingLens++;
    }
    console.log('  Missing tagline: ' + missingTagline + ', missing desc: ' + missingDesc + ', missing domain: ' + missingDomain + ', missing lens: ' + missingLens);
  }

  const { data: bt } = await s.from('blueprint_templates').select('*').order('display_order');
  console.log('\nBLUEPRINT TEMPLATES: ' + (bt?.length || 0));
  if (bt?.length) for (const b of bt) console.log('  ' + b.key + ': "' + b.name + '" — ' + (b.description||'(no desc)'));

  const { data: et } = await s.from('essence_templates').select('*').order('key');
  console.log('\nESSENCE TEMPLATES: ' + (et?.length || 0));
  if (et?.length) for (const e of et) console.log('  ' + e.key + ': "' + e.name + '" — bp: ' + (e.blueprint_key||'none') + ' desc: ' + (e.description||'(no desc)'));

  process.exit(0);
}
m().catch(e => { console.error(e); process.exit(1); });
