// seed-agents.mjs — Upsert agents + create generators + insert
// Uses Supabase REST API directly (no npm packages needed in Node 25)

import fs from "fs";
import { readFileSync } from "fs";

const env = readFileSync(".env.local", "utf8");
const sk = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/m)?.[1]?.replace(/["']/g, "").trim();
const su = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/m)?.[1]?.replace(/["']/g, "").trim();
const headers = { apikey: sk, Authorization: "Bearer " + sk, "Content-Type": "application/json" };
const BASE = su.replace(/\/*$/,'');

const agid = (await fetch(`${BASE}/rest/v1/agent_definitions?select=slug&limit=1`, { headers }).then(r=>r.json())).length > 0;

if (!agid) {
  console.log("⚠  agent_definitions table not accessible");
  process.exit(1);
}

// ── Existing columns in agent_definitions ──
// id, created_at, metadata, canonical_vertical, is_master, is_bridge, is_specialist,
// creator_context, canonical_vertical_slug, slug, canonical_template, agent_type_id,
// name, vertical, tagline, outcome, layer, is_cross_system, agent_id, pool, updated_at

// ── 208 AGENTS ─────────────────────────────────────

const agents = [
  // ── POOL 1: CORE (AGT-001 to AGT-008) ──
  { agent_id:"AGT-001", pool:"core", name:"Executive Twin", slug:"executive_twin", vertical:"general", tagline:"Filters reality, decides, acts", outcome:"Decisions made. Time reclaimed. Output multiplied.", layer:"identity", is_cross_system:false },
  { agent_id:"AGT-002", pool:"core", name:"Communication Sovereign", slug:"communication_sovereign", vertical:"general", tagline:"Every message lands with precision and power", outcome:"Inbox mastered. Relationships advanced. Nothing missed.", layer:"identity", is_cross_system:false },
  { agent_id:"AGT-003", pool:"core", name:"Time Architecture Agent", slug:"time_architecture_agent", vertical:"general", tagline:"Protects your time like a $500/hr EA", outcome:"Calendar locked. Deep work protected.", layer:"blueprint", is_cross_system:false },
  { agent_id:"AGT-004", pool:"core", name:"Operations Command Agent", slug:"operations_command_agent", vertical:"general", tagline:"Nothing falls through. Everything runs on rails.", outcome:"Admin zero. Workflows live.", layer:"execution", is_cross_system:false },
  { agent_id:"AGT-005", pool:"core", name:"Revenue Intelligence Agent", slug:"revenue_intelligence_agent", vertical:"general", tagline:"Finds the money. Tracks it. Closes it.", outcome:"Revenue located. Gaps closed.", layer:"commerce", is_cross_system:false },
  { agent_id:"AGT-006", pool:"core", name:"Identity Architect Agent", slug:"identity_architect_agent", vertical:"general", tagline:"Builds the self-concept that commands every room", outcome:"Positioning crystallized.", layer:"identity", is_cross_system:false },
  { agent_id:"AGT-007", pool:"core", name:"Blueprint Strategist Agent", slug:"blueprint_strategist_agent", vertical:"general", tagline:"Maps the entire business model before a dollar is spent", outcome:"Clarity before chaos.", layer:"blueprint", is_cross_system:false },
  { agent_id:"AGT-008", pool:"core", name:"Governance Intelligence Agent", slug:"governance_intelligence_agent", vertical:"general", tagline:"Audits, flags, and protects — before damage is done", outcome:"Risk caught early.", layer:"governance", is_cross_system:false },

  // ── POOL 2: VERTICAL — Real Estate (lane_1) ──
  { agent_id:"AGT-009", pool:"vertical", name:"Luxury Acquisition & Closing Agent", slug:"luxury_acquisition_agent", vertical:"real_estate", tagline:"Finds, qualifies, nurtures, and CLOSES", outcome:"Pipeline full. Offers accepted.", layer:"commerce", is_cross_system:false, metadata:{lane_key:"lane_1",license_type:"real_estate_license",requires_tier:"studio"} },
  { agent_id:"AGT-010", pool:"vertical", name:"Client Experience Concierge Agent", slug:"re_concierge_agent", vertical:"real_estate", tagline:"White-glove experience that converts clients to fans", outcome:"Referrals automatic.", layer:"identity", is_cross_system:false, metadata:{lane_key:"lane_1",license_type:"real_estate_license",requires_tier:"studio"} },
  { agent_id:"AGT-011", pool:"vertical", name:"Showing Optimization Agent", slug:"showing_optimization_agent", vertical:"real_estate", tagline:"Every showing is a closing in progress", outcome:"Walk-throughs that win.", layer:"execution", is_cross_system:false, metadata:{lane_key:"lane_1",license_type:"real_estate_license",requires_tier:"studio"} },
  { agent_id:"AGT-012", pool:"vertical", name:"Deal Flow & Negotiation Agent", slug:"deal_flow_agent", vertical:"real_estate", tagline:"Moves deals to close faster than the competition", outcome:"Offers stronger.", layer:"commerce", is_cross_system:false, metadata:{lane_key:"lane_1",license_type:"real_estate_license",requires_tier:"studio"} },
  { agent_id:"AGT-013", pool:"vertical", name:"Market & Opportunity Intelligence", slug:"market_intelligence_agent", vertical:"real_estate", tagline:"Finds deals before they become obvious", outcome:"Deals sourced.", layer:"domain", is_cross_system:false, metadata:{lane_key:"lane_1",license_type:"real_estate_license",requires_tier:"studio"} },
  { agent_id:"AGT-014", pool:"vertical", name:"Portfolio Growth Architect", slug:"re_portfolio_architect", vertical:"real_estate", tagline:"Builds the real estate portfolio, not just the sale", outcome:"Assets stacked.", layer:"asset", is_cross_system:false, metadata:{lane_key:"lane_1",license_type:"real_estate_license",requires_tier:"premium"} },
  { agent_id:"AGT-015", pool:"vertical", name:"Property Intelligence & Valuation", slug:"property_intelligence_agent", vertical:"real_estate", tagline:"Precision valuations before any offer is made", outcome:"Valuations accurate.", layer:"domain", is_cross_system:false, metadata:{lane_key:"lane_1",license_type:"real_estate_license",requires_tier:"studio"} },
  { agent_id:"AGT-016", pool:"vertical", name:"Investor Relations & Capital Agent", slug:"re_investor_relations_agent", vertical:"real_estate", tagline:"Turns properties into investor-ready opportunities", outcome:"Capital attracted.", layer:"commerce", is_cross_system:false, is_bridge:true, metadata:{lane_key:"lane_1",bridge_targets:["AGT-139","AGT-140"],license_type:"real_estate_license",requires_tier:"premium"} },

  // ── POOL 2: VERTICAL — Hotel (lane_1 alt) ──
  { agent_id:"AGT-017", pool:"vertical", name:"Guest Experience Concierge Agent", slug:"guest_experience_agent", vertical:"hotel", tagline:"Turns every guest into a loyal advocate", outcome:"Reviews stellar. Loyalty automatic.", layer:"identity", is_cross_system:false, metadata:{lane_key:"lane_2",requires_tier:"studio"} },
  { agent_id:"AGT-018", pool:"vertical", name:"Revenue Management Agent", slug:"revenue_management_agent", vertical:"hotel", tagline:"Optimizes rates, occupancy, and yield in real time", outcome:"RevPAR maximized.", layer:"commerce", is_cross_system:false, metadata:{lane_key:"lane_2",requires_tier:"studio"} },
  { agent_id:"AGT-019", pool:"vertical", name:"Booking & Operations Agent", slug:"booking_operations_agent", vertical:"hotel", tagline:"Every reservation is a profit center", outcome:"Bookings optimized.", layer:"execution", is_cross_system:false, metadata:{lane_key:"lane_2",requires_tier:"studio"} },
  { agent_id:"AGT-020", pool:"vertical", name:"Housekeeping Intelligence Agent", slug:"housekeeping_intel_agent", vertical:"hotel", tagline:"Clean rooms. Full inventory. Happy staff.", outcome:"Turnover seamless.", layer:"execution", is_cross_system:false, metadata:{lane_key:"lane_2",requires_tier:"studio"} },
  { agent_id:"AGT-021", pool:"vertical", name:"Marketing & Distribution Agent", slug:"hotel_marketing_agent", vertical:"hotel", tagline:"Owns the market position across every channel", outcome:"Occupancy up. CAC down.", layer:"commerce", is_cross_system:false, metadata:{lane_key:"lane_2",requires_tier:"studio"} },
  { agent_id:"AGT-022", pool:"vertical", name:"Loyalty & Retention Agent", slug:"loyalty_retention_agent", vertical:"hotel", tagline:"Turns one-time guests into lifetime members", outcome:"Membership driven.", layer:"identity", is_cross_system:false, metadata:{lane_key:"lane_2",requires_tier:"studio"} },
  { agent_id:"AGT-023", pool:"vertical", name:"Event & Group Sales Agent", slug:"event_sales_agent", vertical:"hotel", tagline:"Fills your event spaces before the calendar opens", outcome:"Events booked.", layer:"commerce", is_cross_system:false, metadata:{lane_key:"lane_2",requires_tier:"premium"} },
  { agent_id:"AGT-024", pool:"vertical", name:"Staff Optimization Agent", slug:"staff_optimization_agent", vertical:"hotel", tagline:"Right people. Right shifts. Right budget.", outcome:"Labor optimized.", layer:"execution", is_cross_system:false, metadata:{lane_key:"lane_2",requires_tier:"studio"} },

  // ── POOL 2: VERTICAL — Med Spa (lane_3) ──
  { agent_id:"AGT-025", pool:"vertical", name:"Consultation Conversion Agent", slug:"consultation_conversion_agent", vertical:"med_spa", tagline:"Turns every consultation into a booked package", outcome:"Close rate up. Client in.", layer:"commerce", is_cross_system:false, metadata:{lane_key:"lane_3",license_type:"med_spa",requires_tier:"studio"} },
  { agent_id:"AGT-026", pool:"vertical", name:"Membership & Retention Agent", slug:"membership_retention_agent", vertical:"med_spa", tagline:"Lock in memberships before they leave the room", outcome:"Recurring revenue locked.", layer:"commerce", is_cross_system:false, metadata:{lane_key:"lane_3",license_type:"med_spa",requires_tier:"studio"} },
  { agent_id:"AGT-027", pool:"vertical", name:"Provider Schedule Agent", slug:"provider_schedule_agent", vertical:"med_spa", tagline:"Maximizes chair/bed utilization across every provider", outcome:"Hours packed. Revenue optimized.", layer:"execution", is_cross_system:false, metadata:{lane_key:"lane_3",license_type:"med_spa",requires_tier:"studio"} },
  { agent_id:"AGT-028", pool:"vertical", name:"Treatment Protocol Agent", slug:"treatment_protocol_agent", vertical:"med_spa", tagline:"Every treatment protocol follows best practice", outcome:"Consistency guaranteed.", layer:"execution", is_cross_system:false, metadata:{lane_key:"lane_3",license_type:"med_spa",requires_tier:"studio"} },
  { agent_id:"AGT-029", pool:"vertical", name:"Inventory & Supply Agent", slug:"inventory_supply_agent", vertical:"med_spa", tagline:"Never run out of the products that make you money", outcome:"Stock optimized.", layer:"execution", is_cross_system:false, metadata:{lane_key:"lane_3",license_type:"med_spa",requires_tier:"studio"} },
  { agent_id:"AGT-030", pool:"vertical", name:"Client Journey Agent", slug:"client_journey_agent", vertical:"med_spa", tagline:"Maps the entire client lifecycle from first visit to lifetime", outcome:"Journey mapped. Upsells timed.", layer:"identity", is_cross_system:false, metadata:{lane_key:"lane_3",license_type:"med_spa",requires_tier:"studio"} },
  { agent_id:"AGT-031", pool:"vertical", name:"Brand Compliance Agent", slug:"brand_compliance_agent", vertical:"med_spa", tagline:"Everything on-brand. Everything compliant.", outcome:"Brand locked. Risk managed.", layer:"governance", is_cross_system:false, metadata:{lane_key:"lane_3",license_type:"med_spa",requires_tier:"premium"} },
  { agent_id:"AGT-032", pool:"vertical", name:"Referral Network Agent", slug:"referral_network_agent", vertical:"med_spa", tagline:"Turns every client into a referral engine", outcome:"Referrals flowing.", layer:"commerce", is_cross_system:false, metadata:{lane_key:"lane_3",license_type:"med_spa",requires_tier:"studio"} },

  // ── POOL 2: VERTICAL — Legal (lane_4) ──
  { agent_id:"AGT-033", pool:"vertical", name:"Intake & Qualification Agent", slug:"legal_intake_agent", vertical:"legal", tagline:"Screens, qualifies, and books before the phone rings", outcome:"Cases qualified.", layer:"commerce", is_cross_system:false, metadata:{lane_key:"lane_4",license_type:"none",requires_tier:"studio"} },
  { agent_id:"AGT-034", pool:"vertical", name:"Case Management Agent", slug:"case_management_agent", vertical:"legal", tagline:"Every case moves. Nothing stalls.", outcome:"Deadlines met.", layer:"execution", is_cross_system:false, metadata:{lane_key:"lane_4",license_type:"none",requires_tier:"studio"} },
  { agent_id:"AGT-035", pool:"vertical", name:"Document Intelligence Agent", slug:"document_intel_agent", vertical:"legal", tagline:"Drafts, reviews, and organizes at machine speed", outcome:"Documents done.", layer:"execution", is_cross_system:false, metadata:{lane_key:"lane_4",license_type:"none",requires_tier:"studio"} },
  { agent_id:"AGT-036", pool:"vertical", name:"Discovery Automation Agent", slug:"discovery_automation_agent", vertical:"legal", tagline:"Discovery completed before opposing counsel starts", outcome:"Discovery automated.", layer:"execution", is_cross_system:false, metadata:{lane_key:"lane_4",license_type:"none",requires_tier:"premium"} },
  { agent_id:"AGT-037", pool:"vertical", name:"Billing & Time Tracking Agent", slug:"legal_billing_agent", vertical:"legal", tagline:"Every minute billed. Every invoice sent.", outcome:"Revenue captured.", layer:"commerce", is_cross_system:false, metadata:{lane_key:"lane_4",license_type:"none",requires_tier:"studio"} },
  { agent_id:"AGT-038", pool:"vertical", name:"Compliance & Risk Agent", slug:"compliance_risk_agent", vertical:"legal", tagline:"Regulatory changes caught before they impact you", outcome:"Risk flagged.", layer:"governance", is_cross_system:false, metadata:{lane_key:"lane_4",license_type:"none",requires_tier:"premium"} },

  // ── POOL 2: VERTICAL — Social Services (lane_5) ──
  { agent_id:"AGT-039", pool:"vertical", name:"Housing Placement Agent", slug:"housing_placement_agent", vertical:"social_services", tagline:"Bridge: Social Services to Real Estate", outcome:"Clients housed.", layer:"domain", is_cross_system:false, is_bridge:true, metadata:{lane_key:"lane_5",bridge_targets:["AGT-009","AGT-071"],requires_tier:"studio"} },
  { agent_id:"AGT-040", pool:"vertical", name:"Client Stability Agent", slug:"client_stability_agent", vertical:"social_services", tagline:"Predicts crises before they arrive", outcome:"Stability monitored.", layer:"execution", is_cross_system:false, metadata:{lane_key:"lane_5",requires_tier:"studio"} },
  { agent_id:"AGT-041", pool:"vertical", name:"Case Automation Agent", slug:"case_automation_agent_social", vertical:"social_services", tagline:"Documentation handled. Compliance locked.", outcome:"Cases current.", layer:"execution", is_cross_system:false, metadata:{lane_key:"lane_5",requires_tier:"studio"} },
  { agent_id:"AGT-042", pool:"vertical", name:"Resource Allocation Agent", slug:"resource_allocation_agent", vertical:"social_services", tagline:"Every benefit claimed.", outcome:"Benefits maximized.", layer:"commerce", is_cross_system:false, metadata:{lane_key:"lane_5",requires_tier:"studio"} },
  { agent_id:"AGT-043", pool:"vertical", name:"Engagement & Follow-Through Agent", slug:"engagement_follow_agent", vertical:"social_services", tagline:"Clients do not fall off. Period.", outcome:"Retention absolute.", layer:"workflow", is_cross_system:false, metadata:{lane_key:"lane_5",requires_tier:"studio"} },
  { agent_id:"AGT-044", pool:"vertical", name:"Grant Intelligence Agent", slug:"grant_intelligence_agent", vertical:"social_services", tagline:"Finds every grant before the deadline", outcome:"Funding found.", layer:"commerce", is_cross_system:false, metadata:{lane_key:"lane_5",requires_tier:"studio"} },
  { agent_id:"AGT-045", pool:"vertical", name:"Community Impact Agent", slug:"community_impact_agent", vertical:"social_services", tagline:"Turns mission into measurable outcomes", outcome:"Impact quantified.", layer:"governance", is_cross_system:false, metadata:{lane_key:"lane_5",requires_tier:"studio"} },
  { agent_id:"AGT-046", pool:"vertical", name:"Advocacy & Policy Agent", slug:"advocacy_policy_agent", vertical:"social_services", tagline:"Navigates policy to protect the mission", outcome:"Policy understood.", layer:"governance", is_cross_system:false, is_bridge:true, metadata:{lane_key:"lane_5",bridge_targets:["AGT-081","AGT-082"],requires_tier:"premium"} },

  // ── POOL 7: CROSS-SYSTEM (AGT-151 to AGT-160) ──
  { agent_id:"AGT-151", pool:"cross_system", name:"Calendar Intelligence Agent", slug:"calendar_intel_agent", vertical:"general", tagline:"Your calendar runs itself", outcome:"Schedule optimized.", layer:"execution", is_cross_system:true },
  { agent_id:"AGT-152", pool:"cross_system", name:"Email Command Agent", slug:"email_command_agent", vertical:"general", tagline:"Inbox zero, always", outcome:"Email mastered.", layer:"execution", is_cross_system:true },
  { agent_id:"AGT-153", pool:"cross_system", name:"Notification Control Agent", slug:"notification_control_agent", vertical:"general", tagline:"Only what matters reaches you", outcome:"Distractions blocked.", layer:"execution", is_cross_system:true },
  { agent_id:"AGT-154", pool:"cross_system", name:"Context Memory Agent", slug:"context_memory_agent", vertical:"general", tagline:"Never repeats itself. Always remembers.", outcome:"Memory persistent.", layer:"identity", is_cross_system:true },
  { agent_id:"AGT-155", pool:"cross_system", name:"Decision Support Agent", slug:"decision_support_agent", vertical:"general", tagline:"Every decision has data behind it", outcome:"Decisions informed.", layer:"governance", is_cross_system:true },
  { agent_id:"AGT-156", pool:"cross_system", name:"Workflow Orchestrator", slug:"workflow_orchestrator", vertical:"general", tagline:"Orchestrates every agent like a symphony", outcome:"Workflows synced.", layer:"execution", is_cross_system:true },
  { agent_id:"AGT-157", pool:"cross_system", name:"Report Generator", slug:"report_generator_agent", vertical:"general", tagline:"Produces intelligence reports on demand", outcome:"Reports instant.", layer:"governance", is_cross_system:true },
  { agent_id:"AGT-158", pool:"cross_system", name:"File & Knowledge Agent", slug:"file_knowledge_agent", vertical:"general", tagline:"Your second brain, organized", outcome:"Knowledge accessible.", layer:"identity", is_cross_system:true },
  { agent_id:"AGT-159", pool:"cross_system", name:"Budget Intelligence Agent", slug:"budget_intel_agent", vertical:"general", tagline:"Every dollar tracked. Every spend optimized.", outcome:"Budget clear.", layer:"commerce", is_cross_system:true },
  { agent_id:"AGT-160", pool:"cross_system", name:"Security Sentinel Agent", slug:"security_sentinel_agent", vertical:"general", tagline:"Protects your system 24/7", outcome:"Breaches stopped.", layer:"governance", is_cross_system:true },

  // ── POOL 8: SUITE AGENTS (AGT-161 to AGT-186) ──
  { agent_id:"AGT-161", pool:"suite", name:"Suite Command Agent", slug:"suite_command_agent", vertical:"general", tagline:"Every suite running. Every output delivered.", outcome:"Suites synchronized.", layer:"execution", is_cross_system:true },
  { agent_id:"AGT-162", pool:"suite", name:"Pipeline Architect", slug:"pipeline_architect_agent", vertical:"general", tagline:"Designs multi-stage intelligence pipelines", outcome:"Pipelines designed.", layer:"execution", is_cross_system:true },
  { agent_id:"AGT-163", pool:"suite", name:"Quality Assurance Agent", slug:"qa_agent_suite", vertical:"general", tagline:"Catches errors before they matter", outcome:"Quality verified.", layer:"governance", is_cross_system:true },
  { agent_id:"AGT-164", pool:"suite", name:"Feedback Loop Agent", slug:"feedback_loop_agent", vertical:"general", tagline:"Closes every loop. Continuously improves.", outcome:"Feedback integrated.", layer:"workflow", is_cross_system:true },
  { agent_id:"AGT-165", pool:"suite", name:"Suite Intake Agent", slug:"suite_intake_agent", vertical:"general", tagline:"Onboarding new suites in minutes", outcome:"Intake streamlined.", layer:"execution", is_cross_system:true },
  { agent_id:"AGT-166", pool:"suite", name:"Suite Analytics Agent", slug:"suite_analytics_agent", vertical:"general", tagline:"Every suite measured. Every output analyzed.", outcome:"Analytics live.", layer:"governance", is_cross_system:true },
  { agent_id:"AGT-167", pool:"suite", name:"SLA Enforcement Agent", slug:"sla_enforcement_agent", vertical:"general", tagline:"Service levels never drop", outcome:"SLAs enforced.", layer:"governance", is_cross_system:true },
  { agent_id:"AGT-168", pool:"suite", name:"Suite Memory Agent", slug:"suite_memory_agent", vertical:"general", tagline:"Cross-suite context without overlap", outcome:"Memory unified.", layer:"identity", is_cross_system:true },
  { agent_id:"AGT-169", pool:"suite", name:"Suite Security Agent", slug:"suite_security_agent", vertical:"general", tagline:"Suite-level access control", outcome:"Access controlled.", layer:"governance", is_cross_system:true },
  { agent_id:"AGT-170", pool:"suite", name:"Suite Onboarding Agent", slug:"suite_onboarding_agent", vertical:"general", tagline:"Suite setup & configuration", outcome:"Onboarding automated.", layer:"execution", is_cross_system:true },
  { agent_id:"AGT-171", pool:"suite", name:"Suite Reporting Agent", slug:"suite_reporting_agent", vertical:"general", tagline:"Aggregate suite intelligence reports", outcome:"Reporting unified.", layer:"governance", is_cross_system:true },
  { agent_id:"AGT-172", pool:"suite", name:"Suite Template Agent", slug:"suite_template_agent", vertical:"general", tagline:"Creates suites from templates", outcome:"Templating live.", layer:"execution", is_cross_system:true },
  { agent_id:"AGT-173", pool:"suite", name:"Suite Pricing Agent", slug:"suite_pricing_agent", vertical:"general", tagline:"Prices suites by value", outcome:"Pricing optimized.", layer:"commerce", is_cross_system:true },
  { agent_id:"AGT-174", pool:"suite", name:"Suite Test Agent", slug:"suite_test_agent", vertical:"general", tagline:"Suite sandbox testing", outcome:"Testing complete.", layer:"execution", is_cross_system:true },
  { agent_id:"AGT-175", pool:"suite", name:"Suite Version Agent", slug:"suite_version_agent", vertical:"general", tagline:"Version control for every suite", outcome:"Versions tracked.", layer:"execution", is_cross_system:true },
  { agent_id:"AGT-176", pool:"suite", name:"Suite Sync Agent", slug:"suite_sync_agent", vertical:"general", tagline:"Cross-suite data synchronization", outcome:"Data consistent.", layer:"execution", is_cross_system:true },
  { agent_id:"AGT-177", pool:"suite", name:"Suite Log Agent", slug:"suite_log_agent", vertical:"general", tagline:"Audit logging for every suite action", outcome:"Audit trail live.", layer:"governance", is_cross_system:true },
  { agent_id:"AGT-178", pool:"suite", name:"Suite Dependency Agent", slug:"suite_dependency_agent", vertical:"general", tagline:"Maps suite inter-dependencies", outcome:"Dependencies mapped.", layer:"execution", is_cross_system:true },
  { agent_id:"AGT-179", pool:"suite", name:"Suite Export Agent", slug:"suite_export_agent", vertical:"general", tagline:"Suite data export", outcome:"Data portable.", layer:"execution", is_cross_system:true },
  { agent_id:"AGT-180", pool:"suite", name:"Suite Import Agent", slug:"suite_import_agent", vertical:"general", tagline:"Suite data import", outcome:"Data imported.", layer:"execution", is_cross_system:true },
  { agent_id:"AGT-181", pool:"suite", name:"Suite Notification Agent", slug:"suite_notification_agent", vertical:"general", tagline:"Suite-level alerts", outcome:"Alerts live.", layer:"execution", is_cross_system:true },
  { agent_id:"AGT-182", pool:"suite", name:"Suite Compliance Agent", slug:"suite_compliance_agent", vertical:"general", tagline:"Suite regulatory adherence", outcome:"Compliance maintained.", layer:"governance", is_cross_system:true },
  { agent_id:"AGT-183", pool:"suite", name:"Suite Backup Agent", slug:"suite_backup_agent", vertical:"general", tagline:"Suite state preservation", outcome:"Backups scheduled.", layer:"execution", is_cross_system:true },
  { agent_id:"AGT-184", pool:"suite", name:"Suite Scaling Agent", slug:"suite_scaling_agent", vertical:"general", tagline:"Horizontal suite scaling", outcome:"Scaling automated.", layer:"execution", is_cross_system:true },
  { agent_id:"AGT-185", pool:"suite", name:"Suite Lifecycle Agent", slug:"suite_lifecycle_agent", vertical:"general", tagline:"Suite lifecycle management", outcome:"Lifecycle managed.", layer:"execution", is_cross_system:true },
  { agent_id:"AGT-186", pool:"suite", name:"Suite Dashboard Agent", slug:"suite_dashboard_agent", vertical:"general", tagline:"Suite visualization hub", outcome:"Dashboard active.", layer:"governance", is_cross_system:true },

  // ── POOL 9: UTILITY (AGT-187 to AGT-200) ──
  { agent_id:"AGT-187", pool:"utility", name:"Logging & Monitoring Agent", slug:"logging_monitoring_agent", vertical:"general", tagline:"System health at a glance", outcome:"Health monitored.", layer:"governance", is_cross_system:true },
  { agent_id:"AGT-188", pool:"utility", name:"Rate Limiting Agent", slug:"rate_limiting_agent", vertical:"general", tagline:"Controls API rate usage", outcome:"Limits enforced.", layer:"governance", is_cross_system:true },
  { agent_id:"AGT-189", pool:"utility", name:"Cache Management Agent", slug:"cache_management_agent", vertical:"general", tagline:"Fast data access", outcome:"Cache optimized.", layer:"execution", is_cross_system:true },
  { agent_id:"AGT-190", pool:"utility", name:"Error Handling Agent", slug:"error_handling_agent", vertical:"general", tagline:"Errors caught gracefully", outcome:"Errors handled.", layer:"execution", is_cross_system:true },
  { agent_id:"AGT-191", pool:"utility", name:"Retry & Recovery Agent", slug:"retry_recovery_agent", vertical:"general", tagline:"Failsafe execution", outcome:"Recovery automated.", layer:"execution", is_cross_system:true },
  { agent_id:"AGT-192", pool:"utility", name:"Validation Agent", slug:"validation_agent", vertical:"general", tagline:"Input/output validation", outcome:"Data validated.", layer:"governance", is_cross_system:true },
  { agent_id:"AGT-193", pool:"utility", name:"Formatting Agent", slug:"formatting_agent", vertical:"general", tagline:"Consistent output formatting", outcome:"Formatting clean.", layer:"execution", is_cross_system:true },
  { agent_id:"AGT-194", pool:"utility", name:"Translation Agent", slug:"translation_agent", vertical:"general", tagline:"Multi-language support", outcome:"Languages served.", layer:"execution", is_cross_system:true },
  { agent_id:"AGT-195", pool:"utility", name:"Search Agent", slug:"search_agent_utility", vertical:"general", tagline:"Cross-system search", outcome:"Search instant.", layer:"execution", is_cross_system:true },
  { agent_id:"AGT-196", pool:"utility", name:"Export Agent", slug:"export_agent_utility", vertical:"general", tagline:"System data export", outcome:"Exports ready.", layer:"execution", is_cross_system:true },
  { agent_id:"AGT-197", pool:"utility", name:"Scheduler Agent", slug:"scheduler_agent_utility", vertical:"general", tagline:"Cron-based execution scheduler", outcome:"Scheduled active.", layer:"execution", is_cross_system:true },
  { agent_id:"AGT-198", pool:"utility", name:"Alert Agent", slug:"alert_agent_utility", vertical:"general", tagline:"System event alerting", outcome:"Alerts configured.", layer:"governance", is_cross_system:true },
  { agent_id:"AGT-199", pool:"utility", name:"Health Check Agent", slug:"health_check_agent", vertical:"general", tagline:"System health verification", outcome:"Health verified.", layer:"governance", is_cross_system:true },
  { agent_id:"AGT-200", pool:"utility", name:"Analytics Agent", slug:"analytics_agent_utility", vertical:"general", tagline:"Usage analytics", outcome:"Analytics tracked.", layer:"governance", is_cross_system:true },

  // ── POOL 10: BRIDGE (AGT-201 to AGT-208) ──
  { agent_id:"AGT-201", pool:"bridge", name:"Real Estate to Legal Bridge", slug:"re_legal_bridge", vertical:"general", tagline:"Connects property transactions to legal", outcome:"Transactions legal.", layer:"domain", is_cross_system:true, is_bridge:true, metadata:{bridge_targets:["AGT-009","AGT-033"]} },
  { agent_id:"AGT-202", pool:"bridge", name:"Med Spa to Health Bridge", slug:"medspa_health_bridge", vertical:"general", tagline:"Connects aesthetic treatments to healthcare", outcome:"Health integrated.", layer:"domain", is_cross_system:true, is_bridge:true, metadata:{bridge_targets:["AGT-025","AGT-049"]} },
  { agent_id:"AGT-203", pool:"bridge", name:"Hotel to Real Estate Bridge", slug:"hotel_re_bridge", vertical:"general", tagline:"Links hospitality assets to real estate", outcome:"Properties linked.", layer:"domain", is_cross_system:true, is_bridge:true, metadata:{bridge_targets:["AGT-017","AGT-009"]} },
  { agent_id:"AGT-204", pool:"bridge", name:"Social to Legal Bridge", slug:"social_legal_bridge", vertical:"general", tagline:"Social services to legal aid", outcome:"Justice connected.", layer:"domain", is_cross_system:true, is_bridge:true, metadata:{bridge_targets:["AGT-039","AGT-033"]} },
  { agent_id:"AGT-205", pool:"bridge", name:"HR to Med Spa Bridge", slug:"hr_medspa_bridge", vertical:"general", tagline:"HR systems to med spa operations", outcome:"HR synced.", layer:"domain", is_cross_system:true, is_bridge:true, metadata:{bridge_targets:["AGT-057","AGT-025"]} },
  { agent_id:"AGT-206", pool:"bridge", name:"Creator to Commerce Bridge", slug:"creator_commerce_bridge", vertical:"general", tagline:"Content creators to commerce agents", outcome:"Creator monetized.", layer:"domain", is_cross_system:true, is_bridge:true, metadata:{bridge_targets:["AGT-065","AGT-005"]} },
  { agent_id:"AGT-207", pool:"bridge", name:"E-commerce to Supply Chain Bridge", slug:"ecom_supply_bridge", vertical:"general", tagline:"E-commerce to logistics", outcome:"Supply chain synced.", layer:"domain", is_cross_system:true, is_bridge:true, metadata:{bridge_targets:["AGT-073","AGT-074"]} },
  { agent_id:"AGT-208", pool:"bridge", name:"Health to Social Bridge", slug:"health_social_bridge", vertical:"general", tagline:"Healthcare to social services", outcome:"Care coordinated.", layer:"domain", is_cross_system:true, is_bridge:true, metadata:{bridge_targets:["AGT-049","AGT-039"]} },
];

console.log(`Preparing ${agents.length} agents for upsert...`);

let ok = 0, fail = 0;
for (const a of agents) {
  // Remove fields not in the schema — use metadata for extras
  const payload = {
    agent_id: a.agent_id,
    pool: a.pool,
    name: a.name,
    slug: a.slug,
    vertical: a.vertical,
    tagline: a.tagline,
    outcome: a.outcome,
    layer: a.layer,
    is_cross_system: Boolean(a.is_cross_system),
    is_bridge: Boolean(a.is_bridge),
    metadata: a.metadata ?? {},
  };

  const res = await fetch(`${BASE}/rest/v1/agent_definitions`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => res.statusText);
    // 409 = conflict (slug already exists — upsert would need PUT/PATCH)
    if (res.status === 409) {
      // Update existing
      const upd = await fetch(`${BASE}/rest/v1/agent_definitions?slug=eq.${a.slug}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify(payload),
      });
      if (upd.ok) ok++;
      else { fail++; console.log(`  ❌ ${a.slug}: update failed ${upd.status}`); }
    } else {
      fail++;
      console.log(`  ❌ ${a.slug}: ${err.slice(0,120)}`);
    }
  } else {
    ok++;
  }
}
console.log(`✅ ${ok}/${agents.length} agents upserted${fail > 0 ? ` (${fail} failed)` : ''}`);

// ── CREATE GENERATORS TABLE ─────────────────────────
console.log("\nCreating generators table via REST API...");

// Supabase REST doesn't allow DDL. We'll need to use the pg client or dashboard.
// For now, let's create the table via the pg_query endpoint.
// Since we can't do DDL via REST, use a direct fetch to the pg-client endpoint.

const sqlQuery = `
CREATE TABLE IF NOT EXISTS public.generators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gen_id text NOT NULL,
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  layer text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.generators ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_read" ON public.generators FOR SELECT USING (true);
CREATE POLICY "service_all" ON public.generators FOR ALL USING (true) WITH CHECK (true);
`;

const sqlRes = await fetch(`${BASE}/sql`, {
  method: "POST",
  headers,
  body: JSON.stringify({ query: sqlQuery }),
});

if (sqlRes.ok) {
  console.log("✅ generators table created");
} else {
  const errText = await sqlRes.text().catch(() => "");
  console.log(`⚠  SQL endpoint returned ${sqlRes.status}: ${errText.slice(0,150)}`);
  console.log("   Generators table may not exist. Will try to insert anyway...");
}

// ── INSERT GENERATORS ───────────────────────────────
const generators = [
  { gen_id:"GEN-001", name:"Identity Blueprint Generator", slug:"identity_blueprint_gen", description:"Generates a complete identity and positioning blueprint", layer:"identity" },
  { gen_id:"GEN-002", name:"Brand Foundation Generator", slug:"brand_foundation_gen", description:"Produces the full brand kit: voice, values, visuals", layer:"identity" },
  { gen_id:"GEN-003", name:"Audience Definition Generator", slug:"audience_definition_gen", description:"Maps ideal client avatar with psychographic depth", layer:"blueprint" },
  { gen_id:"GEN-004", name:"Content Strategy Generator", slug:"content_strategy_gen", description:"Builds a 90-day content strategy from scratch", layer:"execution" },
  { gen_id:"GEN-005", name:"Social Posting System Generator", slug:"social_posting_gen", description:"Creates platform-specific posting systems", layer:"execution" },
  { gen_id:"GEN-006", name:"Campaign Generator", slug:"campaign_gen", description:"Generates full campaign briefs with creative direction", layer:"commerce" },
  { gen_id:"GEN-007", name:"Offer Stack Generator", slug:"offer_stack_gen", description:"Produces tiered offer suites", layer:"commerce" },
  { gen_id:"GEN-008", name:"Sales Script Generator", slug:"sales_script_gen", description:"Builds conversation scripts for every touchpoint", layer:"commerce" },
  { gen_id:"GEN-009", name:"Pricing Architecture Generator", slug:"pricing_arch_gen", description:"Outputs optimal pricing models and tiers", layer:"commerce" },
  { gen_id:"GEN-010", name:"Automation Blueprint Generator", slug:"automation_blueprint_gen", description:"Maps all automatable workflows in the business", layer:"execution" },
  { gen_id:"GEN-011", name:"Funnel Architecture Generator", slug:"funnel_arch_gen", description:"Designs complete funnel structures", layer:"commerce" },
  { gen_id:"GEN-012", name:"SOP Generator", slug:"sop_gen", description:"Produces SOPs for any business process", layer:"execution" },
  { gen_id:"GEN-013", name:"AI Twin Profile Generator", slug:"ai_twin_profile_gen", description:"Generates AI twin personality and behavior profile", layer:"identity" },
  { gen_id:"GEN-014", name:"Prompt System Generator", slug:"prompt_system_gen", description:"Builds custom prompt libraries and templates", layer:"execution" },
  { gen_id:"GEN-015", name:"Workflow Blueprint Generator", slug:"workflow_blueprint_gen", description:"Designs workflow sequences for any process", layer:"execution" },
  { gen_id:"GEN-016", name:"Integration Map Generator", slug:"integration_map_gen", description:"Maps all system integration requirements", layer:"blueprint" },
  { gen_id:"GEN-017", name:"Data Schema Generator", slug:"data_schema_gen", description:"Generates data models and schemas", layer:"execution" },
  { gen_id:"GEN-018", name:"API Blueprint Generator", slug:"api_blueprint_gen", description:"Designs API endpoints and contracts", layer:"execution" },
  { gen_id:"GEN-019", name:"Dashboard Generator", slug:"dashboard_gen", description:"Generates KPI dashboards from metrics input", layer:"governance" },
  { gen_id:"GEN-020", name:"Report Template Generator", slug:"report_template_gen", description:"Creates report templates for any audience", layer:"governance" },
  { gen_id:"GEN-021", name:"Email Sequence Generator", slug:"email_sequence_gen", description:"Builds email sequences and drip campaigns", layer:"commerce" },
  { gen_id:"GEN-022", name:"Landing Page Generator", slug:"landing_page_gen", description:"Generates landing page copy and structure", layer:"commerce" },
  { gen_id:"GEN-023", name:"Blog Post Generator", slug:"blog_post_gen", description:"Produces SEO-optimized blog content", layer:"execution" },
  { gen_id:"GEN-024", name:"Video Script Generator", slug:"video_script_gen", description:"Creates video scripts and storyboards", layer:"execution" },
  { gen_id:"GEN-025", name:"Newsletter Generator", slug:"newsletter_gen", description:"Generates newsletter content and layouts", layer:"execution" },
  { gen_id:"GEN-026", name:"Social Post Generator", slug:"social_post_gen", description:"Creates platform-specific social posts", layer:"execution" },
  { gen_id:"GEN-027", name:"Lead Magnet Generator", slug:"lead_magnet_gen", description:"Generates lead magnets and opt-in offers", layer:"commerce" },
  { gen_id:"GEN-028", name:"Webinar Script Generator", slug:"webinar_script_gen", description:"Builds webinar scripts and slide outlines", layer:"commerce" },
  { gen_id:"GEN-029", name:"Case Study Generator", slug:"case_study_gen", description:"Produces client case studies", layer:"execution" },
  { gen_id:"GEN-030", name:"Proposal Generator", slug:"proposal_gen", description:"Generates client proposals and pitches", layer:"commerce" },
  { gen_id:"GEN-031", name:"Contract Generator", slug:"contract_gen", description:"Creates contract templates", layer:"governance" },
  { gen_id:"GEN-032", name:"Brief Generator", slug:"brief_gen", description:"Generates creative and project briefs", layer:"execution" },
  { gen_id:"GEN-033", name:"Timeline Generator", slug:"timeline_gen", description:"Produces project timelines", layer:"execution" },
  { gen_id:"GEN-034", name:"Budget Generator", slug:"budget_gen", description:"Generates budget spreadsheets", layer:"commerce" },
  { gen_id:"GEN-035", name:"Hiring Brief Generator", slug:"hiring_brief_gen", description:"Creates job descriptions and hiring briefs", layer:"execution" },
  { gen_id:"GEN-036", name:"Training Module Generator", slug:"training_module_gen", description:"Builds training content and materials", layer:"execution" },
  { gen_id:"GEN-037", name:"FAQ Generator", slug:"faq_gen", description:"Generates FAQ content", layer:"execution" },
  { gen_id:"GEN-038", name:"Product Description Generator", slug:"product_desc_gen", description:"Creates product descriptions", layer:"commerce" },
  { gen_id:"GEN-039", name:"Testimonial Generator", slug:"testimonial_gen", description:"Generates testimonial prompts", layer:"execution" },
  { gen_id:"GEN-040", name:"Survey Generator", slug:"survey_gen", description:"Creates surveys and feedback forms", layer:"execution" },
  { gen_id:"GEN-041", name:"Scorecard Generator", slug:"scorecard_gen", description:"Produces scoring and evaluation systems", layer:"governance" },
  { gen_id:"GEN-042", name:"Checklist Generator", slug:"checklist_gen", description:"Generates checklists for any process", layer:"execution" },
  { gen_id:"GEN-043", name:"Swarm Configuration Generator", slug:"swarm_config_gen", description:"Designs swarm configurations", layer:"execution" },
  { gen_id:"GEN-044", name:"Agent Prompt Generator", slug:"agent_prompt_gen", description:"Generates agent system prompts", layer:"identity" },
  { gen_id:"GEN-045", name:"Permission Template Generator", slug:"permission_template_gen", description:"Creates permission templates", layer:"governance" },
  { gen_id:"GEN-046", name:"Notification Template Generator", slug:"notification_template_gen", description:"Builds notification templates", layer:"execution" },
  { gen_id:"GEN-047", name:"Brand Voice Generator", slug:"brand_voice_gen", description:"Generates brand voice guidelines", layer:"identity" },
  { gen_id:"GEN-048", name:"Content Calendar Generator", slug:"content_calendar_gen", description:"Creates content calendars", layer:"execution" },
  { gen_id:"GEN-049", name:"Competitive Analysis Generator", slug:"competitive_analysis_gen", description:"Produces competitive analysis", layer:"blueprint" },
  { gen_id:"GEN-050", name:"Market Research Generator", slug:"market_research_gen", description:"Generates market research reports", layer:"blueprint" },
  { gen_id:"GEN-051", name:"Risk Assessment Generator", slug:"risk_assessment_gen", description:"Creates risk assessment matrices", layer:"governance" },
  { gen_id:"GEN-052", name:"Compliance Document Generator", slug:"compliance_doc_gen", description:"Generates compliance documents", layer:"governance" },
  { gen_id:"GEN-053", name:"Migration Plan Generator", slug:"migration_plan_gen", description:"Creates migration plans", layer:"execution" },
  { gen_id:"GEN-054", name:"Deployment Plan Generator", slug:"deployment_plan_gen", description:"Generates deployment plans", layer:"execution" },
  { gen_id:"GEN-055", name:"Business Infrastructure Generator", slug:"biz_infra_gen", description:"Produces business infrastructure blueprints", layer:"execution" },
];

console.log(`\nInserting ${generators.length} generators...`);
let gOk = 0, gFail = 0;
for (const g of generators) {
  const res = await fetch(`${BASE}/rest/v1/generators`, {
    method: "POST",
    headers,
    body: JSON.stringify(g),
  });

  if (res.ok) { gOk++; }
  else if (res.status === 409) {
    // Update existing
    const upd = await fetch(`${BASE}/rest/v1/generators?slug=eq.${g.slug}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify(g),
    });
    if (upd.ok) gOk++;
    else { gFail++; }
  } else {
    const err = await res.text().catch(() => res.statusText);
    console.log(`  ❌ ${g.slug}: ${err.slice(0,120)}`);
    gFail++;
  }
}
console.log(`✅ ${gOk}/${generators.length} generators upserted${gFail > 0 ? ` (${gFail} failed)` : ''}`);
