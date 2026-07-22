/**
 * Create blueprint templates + link essence templates to systems.
 */
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  // 1. Check what columns exist on essence_templates
  const { data: cols } = await s.from('essence_templates').select('*').limit(1);
  console.log('Essence template columns: ' + Object.keys(cols?.[0] || {}).join(', '));

  // 2. Get all omnigrid system slugs and domains
  const { data: sys } = await s.from('omnigrid_intelligence_system').select('system_number, slug, name, domain_key, lens_key').order('system_number');
  const sysByDomain = {};
  for (const s of sys || []) {
    if (!sysByDomain[s.domain_key]) sysByDomain[s.domain_key] = [];
    sysByDomain[s.domain_key].push(s);
  }
  console.log('\nSystems per domain:');
  for (const [k, v] of Object.entries(sysByDomain)) console.log('  ' + k + ': ' + v.length + ' systems');

  // 3. Create blueprint templates for each EE domain
  const EE_DOMAINS = [
    {
      key: 'blueprint_core',
      name: 'Core Blueprint',
      description: 'Foundation identity systems derived from birth data and innate design — who the person is at baseline.',
      vertical_key: null,
      system_domain: 'core_blueprint',
    },
    {
      key: 'essence_profile',
      name: 'Essence Profile',
      description: 'Personality, psychology, motivations, and behavioral tendencies — who the person naturally is.',
      vertical_key: null,
      system_domain: 'behavioral_psychology', // emotional_relational maps to essence
    },
    {
      key: 'rhythm_state',
      name: 'Rhythm & State',
      description: 'Current energy, timing cycles, nervous system state, and recovery needs — how the person is doing right now.',
      vertical_key: null,
      system_domain: 'timing_cycles',
    },
    {
      key: 'alignment_purpose',
      name: 'Alignment & Purpose',
      description: 'Values, strengths, vocation, meaning, and long-term vision — where the person is meant to go.',
      vertical_key: null,
      system_domain: 'purpose_vocation',
    },
    {
      key: 'momentum_execution',
      name: 'Momentum & Execution',
      description: 'Habits, progress, goals, business performance, and execution patterns — how the person makes progress.',
      vertical_key: null,
      system_domain: 'financial_abundance',
    },
    {
      key: 'connections_relationships',
      name: 'Connections & Relationships',
      description: 'How the person relates, communicates, leads, and collaborates with others.',
      vertical_key: null,
      system_domain: 'social_influence',
    },
    {
      key: 'evolution_intelligence',
      name: 'Evolution & Intelligence',
      description: 'AI-learned patterns, predictions, personalized coaching, and continuous optimization.',
      vertical_key: null,
      system_domain: 'ai_learned',
    },
  ];

  console.log('\nCreating blueprint templates...');
  for (const bp of EE_DOMAINS) {
    // Build sections_json from the systems in this domain
    const domainSystems = sysByDomain[bp.system_domain] || [];
    const sections = {};
    domainSystems.forEach((ds, i) => {
      sections[String(i)] = {
        key: ds.slug,
        system_number: ds.system_number,
        name: ds.name,
        order: i + 1,
      };
    });

    const { data: existing } = await s.from('blueprint_templates').select('id').eq('key', bp.key).maybeSingle();
    if (existing) {
      console.log('  EXISTS ' + bp.key + ' — skipping');
      continue;
    }

    const { error } = await s.from('blueprint_templates').insert({
      key: bp.key,
      name: bp.name,
      description: bp.description,
      is_active: true,
      sections_json: sections,
      template_json: {
        version: 1,
        domain_key: bp.system_domain,
        requires_tier: 'personal_solo',
        system_count: domainSystems.length,
      },
    });
    if (error) {
      console.log('  ERR ' + bp.key + ': ' + error.message);
    } else {
      console.log('  CREATED ' + bp.key + ' (' + domainSystems.length + ' systems)');
    }
  }

  // 4. Add system_keys to essence_templates (store in sections_json or as metadata)
  // Since essence_templates don't have required_system_keys column, use template_json
  console.log('\nLinking essence templates to systems...');
  const BP_TO_ESSENCE = {
    blueprint_core: ['standard_essence', 'premium_essence'],
    essence_profile: ['concierge_essence', 'luxe_essence'],
    rhythm_state: ['luxury_client_essence', 'wellness_client_essence'],
    alignment_purpose: ['standard_essence', 'premium_essence'],
    momentum_execution: ['concierge_essence', 'luxe_essence'],
    connections_relationships: ['luxury_hotel_essence', 'luxury_medspa_essence', 'luxury_real_estate_client_essence'],
    evolution_intelligence: ['premium_essence', 'concierge_essence', 'luxe_essence'],
  };

  const { data: essences } = await s.from('essence_templates').select('*');
  for (const e of essences || []) {
    // Find which blueprint templates map to this essence
    const linkedBPs = Object.entries(BP_TO_ESSENCE)
      .filter(([, ess]) => ess.includes(e.key))
      .map(([bp]) => bp);

    if (linkedBPs.length > 0) {
      const tj = e.template_json || {};
      tj.linked_blueprint_keys = linkedBPs;
      tj.blueprint_templates = linkedBPs;
      const { error } = await s.from('essence_templates').update({ template_json: tj }).eq('key', e.key);
      if (error) {
        console.log('  ERR ' + e.key + ': ' + error.message);
      } else {
        console.log('  LINKED ' + e.key + ' -> ' + linkedBPs.join(', '));
      }
    }
  }

  // 5. Also link blueprint_templates to their essence templates
  for (const bp of EE_DOMAINS) {
    const linked = BP_TO_ESSENCE[bp.key] || [];
    if (linked.length > 0) {
      const { data: existing } = await s.from('blueprint_templates').select('id').eq('key', bp.key).single();
      if (existing) {
        const sj = existing.sections_json || {};
        const tj = existing.template_json || {};
        tj.essence_templates = linked;
        tj.total_systems = Object.keys(sj).length;
        const { error } = await s.from('blueprint_templates').update({ template_json: tj }).eq('key', bp.key);
        if (!error) console.log('  BP SYNCED ' + bp.key + ' -> essences: ' + linked.join(', '));
      }
    }
  }

  process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });
