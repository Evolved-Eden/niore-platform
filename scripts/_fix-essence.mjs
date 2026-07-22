import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const MAP = {
  // Tier essences (standard, premium, concierge, luxe)
  business_profile: 'blueprint_snapshot',
  metrics: 'rhythm_indicators',
  tech: 'evolution_tech',
  experience: 'essence_profile',
  team: 'connections_team',
  marketing: 'connections_outreach',
  goals: 'momentum_goals',
  growth: 'alignment_growth',
  ai_readiness: 'evolution_readiness',

  // Vertical essences (hotel)
  property_profile: 'blueprint_property',
  guest_exp_summary: 'essence_experience',
  ops_summary: 'rhythm_operations',
  revenue_summary: 'alignment_revenue',
  marketing_summary: 'connections_market',
  tech_summary: 'evolution_tech',
  growth_summary: 'momentum_growth',

  // Vertical essences (medspa)
  services_summary: 'essence_services',
  client_exp_summary: 'connections_clients',
  team_summary: 'connections_team',
  compliance_summary: 'blueprint_compliance',

  // Vertical essences (real estate)
  agent_profile: 'blueprint_agent',
  portfolio_summary: 'rhythm_portfolio',
  lead_gen_summary: 'momentum_leads',
  client_mgmt_summary: 'connections_clients',
};

async function main() {
  const { data: all } = await s.from('essence_templates').select('*');
  if (!all) { console.log('no data'); process.exit(0); }

  let fixed = 0;
  for (const e of all) {
    const sj = e.sections_json;
    if (!sj || typeof sj !== 'object') continue;

    let changed = false;
    const next = {};
    for (const [idx, section] of Object.entries(sj)) {
      if (typeof section === 'object' && section !== null && section.key) {
        const old = section.key;
        const mapped = MAP[old];
        if (mapped) {
          next[idx] = { key: mapped, order: section.order };
          changed = true;
          console.log('  ' + e.key + ': ' + old + ' -> ' + mapped);
        } else {
          next[idx] = section;
        }
      } else {
        next[idx] = section;
      }
    }

    if (changed) {
      const { error } = await s.from('essence_templates').update({ sections_json: next }).eq('key', e.key);
      if (error) {
        console.log('  ERR ' + e.key + ': ' + error.message);
      } else {
        fixed++;
        console.log('  OK ' + e.key);
      }
    }
  }
  console.log('\nUpdated ' + fixed + ' essence templates');
  process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });
