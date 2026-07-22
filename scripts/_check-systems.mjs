import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

async function main() {
  // 1. omnigrid_systems
  const { data: systems, error: e1 } = await supabase.from('omnigrid_systems').select('*').order('system_number');
  console.log('=== OMNIGRID SYSTEMS (' + (systems?.length || 0) + ') ===');
  if (e1) console.log('ERR:', e1.message);
  if (systems) {
    for (const s of systems) {
      console.log('  #' + s.system_number + ' ' + s.slug + ': "' + s.name + '" — domain: ' + (s.domain_key||'?') + ', lens: ' + (s.lens_key||'?') + ', tier: ' + (s.requires_tier||'none'));
      if (!s.tagline) console.log('    ⚠️ MISSING tagline');
      if (!s.description) console.log('    ⚠️ MISSING description');
      if (!s.domain_key) console.log('    ⚠️ MISSING domain_key');
      if (!s.lens_key) console.log('    ⚠️ MISSING lens_key');
    }
  }

  // 2. system_domains
  const { data: domains } = await supabase.from('system_domains').select('*').order('display_order');
  console.log('\n=== DOMAINS (' + (domains?.length || 0) + ') ===');
  if (domains) {
    for (const d of domains) {
      console.log('  ' + d.key + ': "' + d.name + '" — ' + (d.description||'(no desc)'));
    }
  }

  // 3. system_lenses
  const { data: lenses } = await supabase.from('system_lenses').select('*').order('display_order');
  console.log('\n=== LENSES (' + (lenses?.length || 0) + ') ===');
  if (lenses) {
    for (const l of lenses) {
      console.log('  ' + l.key + ': "' + l.name + '" — ' + (l.description||'(no desc)'));
    }
  }

  // 4. blueprint_templates
  const { data: bps } = await supabase.from('blueprint_templates').select('*').order('display_order');
  console.log('\n=== BLUEPRINT TEMPLATES (' + (bps?.length || 0) + ') ===');
  if (bps) {
    for (const b of bps) {
      console.log('  ' + b.key + ': "' + b.name + '" — active: ' + b.is_active + ', vertical: ' + (b.vertical_id||'none') + ', ordinal: ' + b.ordinal);
      if (!b.description) console.log('    ⚠️ MISSING description');
    }
  }

  // 5. essence_templates
  const { data: ess } = await supabase.from('essence_templates').select('*').order('key');
  console.log('\n=== ESSENCE TEMPLATES (' + (ess?.length || 0) + ') ===');
  if (ess) {
    for (const e of ess) {
      console.log('  ' + e.key + ': "' + e.name + '" — blueprint: ' + (e.blueprint_key||'none') + ', lens: ' + (e.lens_key||'none') + ', active: ' + e.is_active);
      if (!e.description) console.log('    ⚠️ MISSING description');
    }
  }

  // 6. system_groups
  try {
    const { data: groups } = await supabase.from('system_groups').select('*').order('display_order');
    console.log('\n=== SYSTEM GROUPS ===');
    if (groups) groups.forEach(g => console.log('  ' + g.key + ': "' + g.name + '" — ' + (g.description||'(no desc)')));
    else console.log('  (table may not exist or empty)');
  } catch(e) {
    console.log('\n=== SYSTEM GROUPS === table error: ' + e.message);
  }

  // 7. premium_essence
  const { data: prem } = await supabase.from('catalog_items').select('id, name, slug, base_price, description').ilike('name', '%premium%essence%');
  console.log('\n=== PREMIUM ESSENCE IN CATALOG ===');
  if (prem && prem.length) {
    for (const p of prem) console.log('  ' + p.name + ' ($' + p.base_price + '): ' + (p.description||'(no desc)'));
  } else console.log('  (none found in catalog_items)');

  // Check pricing.ts for premium essence
  console.log('\n=== PREMIUM ESSENCE IN pricing.ts ===');
  const { readFileSync } = await import('fs');
  const pricing = readFileSync('lib/pricing.ts', 'utf8');
  const premEssence = pricing.match(/premium_essence[^}]+}/);
  if (premEssence) console.log('  Found: ' + premEssence[0].trim());
  else console.log('  Not found in pricing.ts');

  // 8. Number gaps
  const nums = (systems||[]).map(s => s.system_number).sort((a,b) => a-b);
  const gaps = [];
  for (let i = 1; i <= (nums[nums.length-1] || 0); i++) {
    if (!nums.includes(i)) gaps.push(i);
  }
  if (gaps.length) console.log('\n=== MISSING SYSTEM NUMBERS: ' + gaps.join(', '));
  else console.log('\n=== NO GAPS IN SYSTEM NUMBERING ===');

  // 9. blueprint catalog items
  const { data: allTypes } = await supabase.from('catalog_types').select('id, type_key').eq('type_key', 'blueprint');
  if (allTypes && allTypes.length) {
    const bpTypeId = allTypes[0].id;
    const { data: bpItems } = await supabase.from('catalog_items').select('id, name, slug, base_price, description').eq('catalog_type_id', bpTypeId);
    console.log('\n=== BLUEPRINT CATALOG ITEMS ===');
    if (bpItems && bpItems.length) {
      for (const i of bpItems) console.log('  ' + i.slug + ': "' + i.name + '" $' + i.base_price + ' — ' + (i.description||'(no desc)'));
    } else console.log('  (no items in catalog_items for blueprint type)');
  }

  process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });
