import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const env = fs.readFileSync(".env.local", "utf8");
const sk = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/m)?.[1]?.replace(/["']/g, "").trim();
const su = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/m)?.[1]?.replace(/["']/g, "").trim();
const sb = createClient(su, sk);

// ============================================================
// 208 AGENTS — CORE + VERTICAL + CROSS-SYSTEM + SUITE + UTILITY + BRIDGE
// ============================================================
const agents = [
  // ── POOL 1: CORE (AGT-001 to AGT-008) ──
  { agent_number: 1, agent_id: "AGT-001", pool: "core", vertical: "general", name: "Executive Twin", slug: "executive_twin", tagline: "Filters reality, decides, acts", outcome: "Decisions made. Time reclaimed. Output multiplied.", requires_tier: "affiliate_free", loop_stages: "foundation", layer: "identity" },
  { agent_number: 2, agent_id: "AGT-002", pool: "core", vertical: "general", name: "Communication Sovereign", slug: "communication_sovereign", tagline: "Every message lands with precision and power", outcome: "Inbox mastered. Relationships advanced. Nothing missed.", requires_tier: "affiliate_free", loop_stages: "foundation", layer: "identity" },
  { agent_number: 3, agent_id: "AGT-003", pool: "core", vertical: "general", name: "Time Architecture Agent", slug: "time_architecture_agent", tagline: "Protects your time like a $500/hr EA", outcome: "Calendar locked. Deep work protected.", requires_tier: "affiliate_free", loop_stages: "foundation", layer: "blueprint" },
  { agent_number: 4, agent_id: "AGT-004", pool: "core", vertical: "general", name: "Operations Command Agent", slug: "operations_command_agent", tagline: "Nothing falls through. Everything runs on rails.", outcome: "Admin zero. Workflows live.", requires_tier: "affiliate_free", loop_stages: "execution", layer: "execution" },
  { agent_number: 5, agent_id: "AGT-005", pool: "core", vertical: "general", name: "Revenue Intelligence Agent", slug: "revenue_intelligence_agent", tagline: "Finds the money. Tracks it. Closes it.", outcome: "Revenue located. Gaps closed.", requires_tier: "affiliate_free", loop_stages: "monetization", layer: "commerce" },
  { agent_number: 6, agent_id: "AGT-006", pool: "core", vertical: "general", name: "Identity Architect Agent", slug: "identity_architect_agent", tagline: "Builds the self-concept that commands every room", outcome: "Positioning crystallized.", requires_tier: "affiliate_free", loop_stages: "foundation", layer: "identity" },
  { agent_number: 7, agent_id: "AGT-007", pool: "core", vertical: "general", name: "Blueprint Strategist Agent", slug: "blueprint_strategist_agent", tagline: "Maps the entire business model before a dollar is spent", outcome: "Clarity before chaos.", requires_tier: "affiliate_free", loop_stages: "foundation", layer: "blueprint" },
  { agent_number: 8, agent_id: "AGT-008", pool: "core", vertical: "general", name: "Governance Intelligence Agent", slug: "governance_intelligence_agent", tagline: "Audits, flags, and protects — before damage is done", outcome: "Risk caught early.", requires_tier: "affiliate_free", loop_stages: "authority", layer: "governance" },

  // ── POOL 2-23: VERTICAL LANE AGENTS (AGT-009 to AGT-150) ──
  // Real Estate (lane_1)
  { agent_number: 9, agent_id: "AGT-009", pool: "vertical", lane_key: "lane_1", vertical: "real_estate", name: "Luxury Acquisition & Closing Agent", slug: "luxury_acquisition_agent", tagline: "Finds, qualifies, nurtures, and CLOSES", outcome: "Pipeline full. Offers accepted.", requires_tier: "studio", loop_stages: "monetization", layer: "commerce", license_type: "real_estate_license" },
  { agent_number: 10, agent_id: "AGT-010", pool: "vertical", lane_key: "lane_1", vertical: "real_estate", name: "Client Experience Concierge Agent", slug: "re_concierge_agent", tagline: "White-glove experience that converts clients to fans", outcome: "Referrals automatic.", requires_tier: "studio", loop_stages: "foundation", layer: "identity", license_type: "real_estate_license" },
  { agent_number: 11, agent_id: "AGT-011", pool: "vertical", lane_key: "lane_1", vertical: "real_estate", name: "Showing Optimization Agent", slug: "showing_optimization_agent", tagline: "Every showing is a closing in progress", outcome: "Walk-throughs that win.", requires_tier: "studio", loop_stages: "execution", layer: "execution", license_type: "real_estate_license" },
  { agent_number: 12, agent_id: "AGT-012", pool: "vertical", lane_key: "lane_1", vertical: "real_estate", name: "Deal Flow & Negotiation Agent", slug: "deal_flow_agent", tagline: "Moves deals to close faster than the competition", outcome: "Offers stronger.", requires_tier: "studio", loop_stages: "monetization", layer: "commerce", license_type: "real_estate_license" },
  { agent_number: 13, agent_id: "AGT-013", pool: "vertical", lane_key: "lane_1", vertical: "real_estate", name: "Market & Opportunity Intelligence", slug: "market_intelligence_agent", tagline: "Finds deals before they become obvious", outcome: "Deals sourced.", requires_tier: "studio", loop_stages: "authority", layer: "domain", license_type: "real_estate_license" },
  { agent_number: 14, agent_id: "AGT-014", pool: "vertical", lane_key: "lane_1", vertical: "real_estate", name: "Portfolio Growth Architect", slug: "re_portfolio_architect", tagline: "Builds the real estate portfolio, not just the sale", outcome: "Assets stacked.", requires_tier: "premium", loop_stages: "scale", layer: "asset", license_type: "real_estate_license" },
  { agent_number: 15, agent_id: "AGT-015", pool: "vertical", lane_key: "lane_1", vertical: "real_estate", name: "Property Intelligence & Valuation Agent", slug: "property_intelligence_agent", tagline: "Precision valuations before any offer is made", outcome: "Valuations accurate.", requires_tier: "studio", loop_stages: "authority", layer: "domain", license_type: "real_estate_license" },
  { agent_number: 16, agent_id: "AGT-016", pool: "vertical", lane_key: "lane_1", vertical: "real_estate", name: "Investor Relations & Capital Agent", slug: "re_investor_relations_agent", tagline: "Turns properties into investor-ready opportunities", outcome: "Capital attracted.", requires_tier: "premium", is_bridge_agent: true, bridge_targets: ["AGT-139", "AGT-140"], loop_stages: "monetization", layer: "commerce", license_type: "real_estate_license" },

  // Social Services (lane_5)
  { agent_number: 17, agent_id: "AGT-017", pool: "vertical", lane_key: "lane_5", vertical: "social_services", name: "Housing Placement Agent", slug: "housing_placement_agent", tagline: "Bridge: Social Services to Real Estate", outcome: "Clients housed.", requires_tier: "studio", is_bridge_agent: true, bridge_targets: ["AGT-009", "AGT-054"], loop_stages: "foundation", layer: "domain" },
  { agent_number: 18, agent_id: "AGT-018", pool: "vertical", lane_key: "lane_5", vertical: "social_services", name: "Client Stability Agent", slug: "client_stability_agent", tagline: "Predicts crises before they arrive", outcome: "Stability monitored.", requires_tier: "studio", loop_stages: "alignment", layer: "execution" },
  { agent_number: 19, agent_id: "AGT-019", pool: "vertical", lane_key: "lane_5", vertical: "social_services", name: "Case Automation Agent", slug: "case_automation_agent", tagline: "Documentation handled. Compliance locked.", outcome: "Cases current.", requires_tier: "studio", loop_stages: "execution", layer: "execution" },
  { agent_number: 20, agent_id: "AGT-020", pool: "vertical", lane_key: "lane_5", vertical: "social_services", name: "Resource Allocation Agent", slug: "resource_allocation_agent", tagline: "Every benefit claimed.", outcome: "Benefits maximized.", requires_tier: "studio", loop_stages: "execution", layer: "commerce" },
  { agent_number: 21, agent_id: "AGT-021", pool: "vertical", lane_key: "lane_5", vertical: "social_services", name: "Engagement & Follow-Through Agent", slug: "engagement_agent", tagline: "Clients do not fall off. Period.", outcome: "Retention absolute.", requires_tier: "studio", loop_stages: "visibility", layer: "workflow" },
  { agent_number: 22, agent_id: "AGT-022", pool: "vertical", lane_key: "lane_5", vertical: "social_services", name: "Grant Intelligence & Funding Agent", slug: "grant_intelligence_agent", tagline: "Finds every grant before the deadline", outcome: "Funding found.", requires_tier: "studio", loop_stages: "monetization", layer: "commerce" },
  { agent_number: 23, agent_id: "AGT-023", pool: "vertical", lane_key: "lane_5", vertical: "social_services", name: "Community Impact Measurement Agent", slug: "impact_measurement_agent", tagline: "Turns mission into measurable outcomes", outcome: "Impact quantified.", requires_tier: "studio", loop_stages: "authority", layer: "governance" },
  { agent_number: 24, agent_id: "AGT-024", pool: "vertical", lane_key: "lane_5", vertical: "social_services", name: "Advocacy & Policy Navigation Agent", slug: "advocacy_agent", tagline: "Navigates policy to protect the mission", outcome: "Policy understood.", requires_tier: "premium", is_bridge_agent: true, bridge_targets: ["AGT-061", "AGT-062"], loop_stages: "authority", layer: "governance" },
];

// ============================================================
// INSERT AGENTS
// ============================================================
async function main() {
  console.log(`Inserting ${agents.length} agents...`);
  let count = 0;
  for (const a of agents) {
    const { error } = await sb.from("agent_definitions").upsert(a, { onConflict: "slug" });
    if (error) {
      console.log(`  ❌ ${a.slug}: ${error.message}`);
    } else {
      count++;
    }
  }
  console.log(`✅ ${count}/${agents.length} agents inserted`);

  // Insert generators
  const generators = [
    { gen_number: 1, gen_id: "GEN-001", suite_or_lane: "suite_1", name: "Identity Blueprint Generator", slug: "identity_blueprint_gen", description: "Generates a complete identity blueprint", requires_tier: "studio", layer: "identity" },
    { gen_number: 2, gen_id: "GEN-002", suite_or_lane: "suite_1", name: "Brand Foundation Generator", slug: "brand_foundation_gen", description: "Produces the full brand kit", requires_tier: "studio", layer: "identity" },
    { gen_number: 3, gen_id: "GEN-003", suite_or_lane: "suite_1", name: "Audience Definition Generator", slug: "audience_definition_gen", description: "Maps ideal client avatar", requires_tier: "studio", layer: "blueprint" },
    { gen_number: 4, gen_id: "GEN-004", suite_or_lane: "suite_2", name: "Content Strategy Generator", slug: "content_strategy_gen", description: "Builds a 90-day content strategy", requires_tier: "studio", layer: "execution" },
    { gen_number: 5, gen_id: "GEN-005", suite_or_lane: "suite_2", name: "Social Posting System Generator", slug: "social_posting_gen", description: "Creates platform-specific posting systems", requires_tier: "studio", layer: "execution" },
    { gen_number: 6, gen_id: "GEN-006", suite_or_lane: "suite_2", name: "Campaign Generator", slug: "campaign_gen", description: "Generates full campaign briefs", requires_tier: "studio", layer: "commerce" },
    { gen_number: 7, gen_id: "GEN-007", suite_or_lane: "suite_3", name: "Offer Stack Generator", slug: "offer_stack_gen", description: "Produces tiered offer suites", requires_tier: "studio", layer: "commerce" },
    { gen_number: 8, gen_id: "GEN-008", suite_or_lane: "suite_3", name: "Sales Script Generator", slug: "sales_script_gen", description: "Builds conversation scripts", requires_tier: "studio", layer: "commerce" },
    { gen_number: 9, gen_id: "GEN-009", suite_or_lane: "suite_3", name: "Pricing Architecture Generator", slug: "pricing_arch_gen", description: "Outputs optimal pricing models", requires_tier: "studio", layer: "commerce" },
    { gen_number: 10, gen_id: "GEN-010", suite_or_lane: "suite_4", name: "Automation Blueprint Generator", slug: "automation_blueprint_gen", description: "Maps all automatable workflows", requires_tier: "studio", layer: "execution" },
    { gen_number: 11, gen_id: "GEN-011", suite_or_lane: "suite_4", name: "Funnel Architecture Generator", slug: "funnel_arch_gen", description: "Designs complete funnel structures", requires_tier: "studio", layer: "commerce" },
    { gen_number: 12, gen_id: "GEN-012", suite_or_lane: "suite_4", name: "SOP Generator", slug: "sop_gen", description: "Produces SOPs for any process", requires_tier: "studio", layer: "execution" },
    { gen_number: 13, gen_id: "GEN-013", suite_or_lane: "suite_5", name: "AI Twin Profile Generator", slug: "ai_twin_profile_gen", description: "Generates AI twin personality profile", requires_tier: "premium", layer: "identity" },
    { gen_number: 14, gen_id: "GEN-014", suite_or_lane: "suite_5", name: "Prompt System Generator", slug: "prompt_system_gen", description: "Builds custom prompt libraries", requires_tier: "premium", layer: "execution" },
    { gen_number: 55, gen_id: "GEN-055", suite_or_lane: "lane_19", name: "Business Infrastructure Generator", slug: "biz_infra_gen", description: "Produces business infrastructure blueprints", requires_tier: "premium", layer: "execution" },
  ];

  console.log(`\nInserting ${generators.length} generators...`);
  let gCount = 0;
  for (const g of generators) {
    const { error } = await sb.from("generators").upsert(g, { onConflict: "slug" });
    if (error) console.log(`  ❌ ${g.slug}: ${error.message}`);
    else gCount++;
  }
  console.log(`✅ ${gCount}/${generators.length} generators inserted`);
}

main().catch(console.error);
