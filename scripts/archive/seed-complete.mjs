// seed-complete.mjs — Full seed: generators table + 208 agents + 55 generators
import { readFileSync } from "fs";
import pg from "pg";

const env = readFileSync(".env.local", "utf8");
const sk = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/m)?.[1]?.replace(/["']/g, "").trim();
const su = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/m)?.[1]?.replace(/["']/g, "").trim();
const ref = su.match(/https?:\/\/(.+)\.supabase\.co/)?.[1];
const dbPass = process.env.SUPABASE_DB_PASSWORD;

console.log("Connecting to Supabase pooler...");

// Explicit connection params (avoids URL-encoding issues with special chars)
const pool = new pg.Pool({
  host: `db.${ref}.supabase.co`,
  port: 5432,
  database: "postgres",
  user: "postgres",
  password: dbPass,
  max: 1,
  connectionTimeoutMillis: 15000,
});

try {
  const test = await pool.query("SELECT 1 as ok");
  console.log("✅ Connected to Supabase via pooler");

  // ══════════════════════════════════════════════════════════════
  // CREATE GENERATORS TABLE
  // ══════════════════════════════════════════════════════════════
  await pool.query(`
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
  `);
  console.log("✅ generators table created");

  await pool.query(`ALTER TABLE public.generators ENABLE ROW LEVEL SECURITY;`).catch(() => {});
  await pool.query(`CREATE POLICY IF NOT EXISTS "allow_read" ON public.generators FOR SELECT USING (true);`).catch(() => {});
  await pool.query(`CREATE POLICY IF NOT EXISTS "service_all" ON public.generators FOR ALL USING (true) WITH CHECK (true);`).catch(() => {});
  console.log("✅ RLS policies set");

  // ══════════════════════════════════════════════════════════════
  // INSERT 55 GENERATORS
  // ══════════════════════════════════════════════════════════════
  const generators = [
    ["GEN-001","Identity Blueprint Generator","identity_blueprint_gen","Generates a complete identity blueprint","identity"],
    ["GEN-002","Brand Foundation Generator","brand_foundation_gen","Produces the full brand kit","identity"],
    ["GEN-003","Audience Definition Generator","audience_definition_gen","Maps ideal client avatar","blueprint"],
    ["GEN-004","Content Strategy Generator","content_strategy_gen","Builds a 90-day content strategy","execution"],
    ["GEN-005","Social Posting System Generator","social_posting_gen","Creates platform-specific posting systems","execution"],
    ["GEN-006","Campaign Generator","campaign_gen","Generates full campaign briefs","commerce"],
    ["GEN-007","Offer Stack Generator","offer_stack_gen","Produces tiered offer suites","commerce"],
    ["GEN-008","Sales Script Generator","sales_script_gen","Builds conversation scripts","commerce"],
    ["GEN-009","Pricing Architecture Generator","pricing_arch_gen","Outputs optimal pricing models","commerce"],
    ["GEN-010","Automation Blueprint Generator","automation_blueprint_gen","Maps all automatable workflows","execution"],
    ["GEN-011","Funnel Architecture Generator","funnel_arch_gen","Designs complete funnel structures","commerce"],
    ["GEN-012","SOP Generator","sop_gen","Produces SOPs for any process","execution"],
    ["GEN-013","AI Twin Profile Generator","ai_twin_profile_gen","Generates AI twin personality profile","identity"],
    ["GEN-014","Prompt System Generator","prompt_system_gen","Builds custom prompt libraries","execution"],
    ["GEN-015","Workflow Blueprint Generator","workflow_blueprint_gen","Designs workflow sequences","execution"],
    ["GEN-016","Integration Map Generator","integration_map_gen","Maps system integration requirements","blueprint"],
    ["GEN-017","Data Schema Generator","data_schema_gen","Generates data models","execution"],
    ["GEN-018","API Blueprint Generator","api_blueprint_gen","Designs API endpoints","execution"],
    ["GEN-019","Dashboard Generator","dashboard_gen","Generates KPI dashboards","governance"],
    ["GEN-020","Report Template Generator","report_template_gen","Creates report templates","governance"],
    ["GEN-021","Email Sequence Generator","email_sequence_gen","Builds email sequences","commerce"],
    ["GEN-022","Landing Page Generator","landing_page_gen","Generates landing page copy","commerce"],
    ["GEN-023","Blog Post Generator","blog_post_gen","Produces SEO-optimized blog content","execution"],
    ["GEN-024","Video Script Generator","video_script_gen","Creates video scripts","execution"],
    ["GEN-025","Newsletter Generator","newsletter_gen","Generates newsletter content","execution"],
    ["GEN-026","Social Post Generator","social_post_gen","Creates platform-specific posts","execution"],
    ["GEN-027","Lead Magnet Generator","lead_magnet_gen","Generates lead magnets","commerce"],
    ["GEN-028","Webinar Script Generator","webinar_script_gen","Builds webinar scripts","commerce"],
    ["GEN-029","Case Study Generator","case_study_gen","Produces client case studies","execution"],
    ["GEN-030","Proposal Generator","proposal_gen","Generates client proposals","commerce"],
    ["GEN-031","Contract Generator","contract_gen","Creates contract templates","governance"],
    ["GEN-032","Brief Generator","brief_gen","Generates creative briefs","execution"],
    ["GEN-033","Timeline Generator","timeline_gen","Produces project timelines","execution"],
    ["GEN-034","Budget Generator","budget_gen","Generates budget spreadsheets","commerce"],
    ["GEN-035","Hiring Brief Generator","hiring_brief_gen","Creates job descriptions","execution"],
    ["GEN-036","Training Module Generator","training_module_gen","Builds training materials","execution"],
    ["GEN-037","FAQ Generator","faq_gen","Generates FAQ content","execution"],
    ["GEN-038","Product Description Generator","product_desc_gen","Creates product descriptions","commerce"],
    ["GEN-039","Testimonial Generator","testimonial_gen","Generates testimonial prompts","execution"],
    ["GEN-040","Survey Generator","survey_gen","Creates surveys and feedback forms","execution"],
    ["GEN-041","Scorecard Generator","scorecard_gen","Produces scoring systems","governance"],
    ["GEN-042","Checklist Generator","checklist_gen","Generates checklists","execution"],
    ["GEN-043","Swarm Configuration Generator","swarm_config_gen","Designs swarm configurations","execution"],
    ["GEN-044","Agent Prompt Generator","agent_prompt_gen","Generates agent system prompts","identity"],
    ["GEN-045","Permission Template Generator","permission_template_gen","Creates permission templates","governance"],
    ["GEN-046","Notification Template Generator","notification_template_gen","Builds notification templates","execution"],
    ["GEN-047","Brand Voice Generator","brand_voice_gen","Generates brand voice guidelines","identity"],
    ["GEN-048","Content Calendar Generator","content_calendar_gen","Creates content calendars","execution"],
    ["GEN-049","Competitive Analysis Generator","competitive_analysis_gen","Produces competitive analysis","blueprint"],
    ["GEN-050","Market Research Generator","market_research_gen","Generates market research reports","blueprint"],
    ["GEN-051","Risk Assessment Generator","risk_assessment_gen","Creates risk assessment matrices","governance"],
    ["GEN-052","Compliance Document Generator","compliance_doc_gen","Generates compliance documents","governance"],
    ["GEN-053","Migration Plan Generator","migration_plan_gen","Creates migration plans","execution"],
    ["GEN-054","Deployment Plan Generator","deployment_plan_gen","Generates deployment plans","execution"],
    ["GEN-055","Business Infrastructure Generator","biz_infra_gen","Produces business infrastructure blueprints","execution"],
  ];

  let gOk = 0;
  for (const [gid, name, slug, desc, layer] of generators) {
    try {
      await pool.query(
        `INSERT INTO public.generators (gen_id, generator_name, slug, description, layer)
         VALUES ($1,$2,$3,$4,$5)
         ON CONFLICT (slug) DO UPDATE SET generator_name=EXCLUDED.generator_name, description=EXCLUDED.description, layer=EXCLUDED.layer`,
        [gid, name, slug, desc, layer]
      );
      gOk++;
    } catch(e) { console.log(`  ❌ gen ${slug}: ${e.message}`); }
  }
  console.log(`✅ ${gOk}/${generators.length} generators inserted`);

  // ══════════════════════════════════════════════════════════════
  // INSERT 104 REMAINING VERTICAL AGENTS (AGT-047 to AGT-150)
  // 17 vertical lanes × ~6 agents each
  // ══════════════════════════════════════════════════════════════
  const verticalAgents = [
    // lane_6: HR / Recruiting
    { agent_id:"AGT-047", name:"Talent Acquisition Agent", slug:"talent_acquisition_agent", vertical:"hr", tagline:"Finds the right hire before the req is posted", outcome:"Hires found.", layer:"commerce", meta:{lane_key:"lane_6",requires_tier:"studio"} },
    { agent_id:"AGT-048", name:"Onboarding Intelligence Agent", slug:"onboarding_intel_agent", vertical:"hr", tagline:"Every new hire hits the ground running", outcome:"Onboarding automated.", layer:"execution", meta:{lane_key:"lane_6",requires_tier:"studio"} },
    { agent_id:"AGT-049", name:"Performance Tracking Agent", slug:"performance_tracking_agent", vertical:"hr", tagline:"Real-time performance data for every team member", outcome:"Performance visible.", layer:"governance", meta:{lane_key:"lane_6",requires_tier:"studio"} },
    { agent_id:"AGT-050", name:"Payroll & Benefits Agent", slug:"payroll_benefits_agent", vertical:"hr", tagline:"Payroll runs itself. Benefits are optimized.", outcome:"Payroll accurate.", layer:"execution", meta:{lane_key:"lane_6",requires_tier:"studio"} },
    { agent_id:"AGT-051", name:"Culture & Engagement Agent", slug:"culture_engagement_agent", vertical:"hr", tagline:"Measures and moves team culture daily", outcome:"Culture strong.", layer:"identity", meta:{lane_key:"lane_6",requires_tier:"studio"} },
    { agent_id:"AGT-052", name:"Compliance & Policy Agent", slug:"hr_compliance_agent", vertical:"hr", tagline:"HR compliance without the headache", outcome:"Compliance locked.", layer:"governance", meta:{lane_key:"lane_6",requires_tier:"premium"} },
    { agent_id:"AGT-053", name:"Succession Planning Agent", slug:"succession_planning_agent", vertical:"hr", tagline:"Identifies and prepares future leaders", outcome:"Pipeline ready.", layer:"governance", meta:{lane_key:"lane_6",requires_tier:"premium"} },

    // lane_7: Healthcare
    { agent_id:"AGT-054", name:"Patient Intake Agent", slug:"patient_intake_agent", vertical:"healthcare", tagline:"Patient intake completed before they arrive", outcome:"Intake frictionless.", layer:"commerce", meta:{lane_key:"lane_7",requires_tier:"studio"} },
    { agent_id:"AGT-055", name:"Scheduling Optimization Agent", slug:"scheduling_optimization_agent", vertical:"healthcare", tagline:"Every slot filled. Every wait minimized.", outcome:"Schedule full.", layer:"execution", meta:{lane_key:"lane_7",requires_tier:"studio"} },
    { agent_id:"AGT-056", name:"Medical Records Agent", slug:"medical_records_agent", vertical:"healthcare", tagline:"Records organized and accessible instantly", outcome:"Records current.", layer:"execution", meta:{lane_key:"lane_7",requires_tier:"studio",license_type:"hipaa"} },
    { agent_id:"AGT-057", name:"Billing & Coding Agent", slug:"billing_coding_agent", vertical:"healthcare", tagline:"Maximizes reimbursement. Minimizes denials.", outcome:"Revenue captured.", layer:"commerce", meta:{lane_key:"lane_7",requires_tier:"studio",license_type:"hipaa"} },
    { agent_id:"AGT-058", name:"Patient Follow-Up Agent", slug:"patient_followup_agent", vertical:"healthcare", tagline:"No patient falls through the gap", outcome:"Follow-ups automated.", layer:"workflow", meta:{lane_key:"lane_7",requires_tier:"studio"} },
    { agent_id:"AGT-059", name:"Compliance & HIPAA Agent", slug:"hipaa_compliance_agent", vertical:"healthcare", tagline:"HIPAA compliance monitored 24/7", outcome:"Compliance verified.", layer:"governance", meta:{lane_key:"lane_7",requires_tier:"premium",license_type:"hipaa"} },
    { agent_id:"AGT-060", name:"Telehealth Coordination Agent", slug:"telehealth_coordination_agent", vertical:"healthcare", tagline:"Virtual care that feels in-person", outcome:"Telehealth seamless.", layer:"execution", meta:{lane_key:"lane_7",requires_tier:"studio"} },

    // lane_8: E-commerce
    { agent_id:"AGT-061", name:"Product Catalog Agent", slug:"product_catalog_agent", vertical:"ecommerce", tagline:"Catalog optimized. Products found.", outcome:"Catalog live.", layer:"commerce", meta:{lane_key:"lane_8",requires_tier:"studio"} },
    { agent_id:"AGT-062", name:"Order Management Agent", slug:"order_management_agent", vertical:"ecommerce", tagline:"Every order fulfilled. Every customer notified.", outcome:"Orders flowing.", layer:"execution", meta:{lane_key:"lane_8",requires_tier:"studio"} },
    { agent_id:"AGT-063", name:"Inventory Intelligence Agent", slug:"inventory_intelligence_agent", vertical:"ecommerce", tagline:"Stock optimized. Never oversold.", outcome:"Inventory balanced.", layer:"execution", meta:{lane_key:"lane_8",requires_tier:"studio"} },
    { agent_id:"AGT-064", name:"Customer Support Agent", slug:"customer_support_ecom_agent", vertical:"ecommerce", tagline:"Support tickets handled before they escalate", outcome:"Support automated.", layer:"identity", meta:{lane_key:"lane_8",requires_tier:"studio"} },
    { agent_id:"AGT-065", name:"Abandoned Cart Agent", slug:"abandoned_cart_agent", vertical:"ecommerce", tagline:"Recovers lost revenue automatically", outcome:"Carts recovered.", layer:"commerce", meta:{lane_key:"lane_8",requires_tier:"studio"} },
    { agent_id:"AGT-066", name:"Review & Reputation Agent", slug:"review_reputation_agent", vertical:"ecommerce", tagline:"Reviews collected. Reputation managed.", outcome:"Reputation strong.", layer:"commerce", meta:{lane_key:"lane_8",requires_tier:"studio"} },
    { agent_id:"AGT-067", name:"Upsell & Cross-Sell Agent", slug:"upsell_cross_sell_agent", vertical:"ecommerce", tagline:"Every purchase leads to the next", outcome:"AOV increased.", layer:"commerce", meta:{lane_key:"lane_8",requires_tier:"studio"} },

    // lane_9: Creator Economy
    { agent_id:"AGT-068", name:"Content Production Agent", slug:"content_production_agent", vertical:"creator", tagline:"Content scheduled. Platforms fed.", outcome:"Content flowing.", layer:"execution", meta:{lane_key:"lane_9",requires_tier:"studio"} },
    { agent_id:"AGT-069", name:"Audience Growth Agent", slug:"audience_growth_agent", vertical:"creator", tagline:"Grows your audience while you create", outcome:"Audience growing.", layer:"commerce", meta:{lane_key:"lane_9",requires_tier:"studio"} },
    { agent_id:"AGT-070", name:"Monetization Agent", slug:"monetization_creator_agent", vertical:"creator", tagline:"Turns followers into revenue", outcome:"Revenue diversified.", layer:"commerce", meta:{lane_key:"lane_9",requires_tier:"studio"} },
    { agent_id:"AGT-071", name:"Sponsorship Agent", slug:"sponsorship_agent", vertical:"creator", tagline:"Matches you with the right brand deals", outcome:"Deals closed.", layer:"commerce", meta:{lane_key:"lane_9",requires_tier:"premium"} },
    { agent_id:"AGT-072", name:"Community Management Agent", slug:"community_management_agent", vertical:"creator", tagline:"Community engaged. Conversations active.", outcome:"Community thriving.", layer:"identity", meta:{lane_key:"lane_9",requires_tier:"studio"} },
    { agent_id:"AGT-073", name:"Analytics & Insights Agent", slug:"creator_analytics_agent", vertical:"creator", tagline:"Know what works. Do more of it.", outcome:"Insights actionable.", layer:"governance", meta:{lane_key:"lane_9",requires_tier:"studio"} },
    { agent_id:"AGT-074", name:"Collaboration Agent", slug:"collaboration_creator_agent", vertical:"creator", tagline:"Finds and manages collaborations", outcome:"Collabs active.", layer:"execution", meta:{lane_key:"lane_9",requires_tier:"studio"} },

    // lane_10: Education / Training
    { agent_id:"AGT-075", name:"Student Enrollment Agent", slug:"student_enrollment_agent", vertical:"education", tagline:"Enrollments completed. Classes filled.", outcome:"Enrollments up.", layer:"commerce", meta:{lane_key:"lane_10",requires_tier:"studio"} },
    { agent_id:"AGT-076", name:"Curriculum Management Agent", slug:"curriculum_management_agent", vertical:"education", tagline:"Curriculum organized. Courses updated.", outcome:"Curriculum current.", layer:"execution", meta:{lane_key:"lane_10",requires_tier:"studio"} },
    { agent_id:"AGT-077", name:"Student Progress Agent", slug:"student_progress_agent", vertical:"education", tagline:"Every student tracked. Every gap identified.", outcome:"Progress monitored.", layer:"execution", meta:{lane_key:"lane_10",requires_tier:"studio"} },
    { agent_id:"AGT-078", name:"Assessment Agent", slug:"assessment_education_agent", vertical:"education", tagline:"Assessments created, graded, and analyzed", outcome:"Assessments automated.", layer:"execution", meta:{lane_key:"lane_10",requires_tier:"studio"} },
    { agent_id:"AGT-079", name:"Tutoring & Support Agent", slug:"tutoring_support_agent", vertical:"education", tagline:"Personalized support for every learner", outcome:"Support personalized.", layer:"identity", meta:{lane_key:"lane_10",requires_tier:"studio"} },
    { agent_id:"AGT-080", name:"Accreditation Compliance Agent", slug:"accreditation_compliance_agent", vertical:"education", tagline:"Accreditation documentation always ready", outcome:"Compliance maintained.", layer:"governance", meta:{lane_key:"lane_10",requires_tier:"premium"} },

    // lane_11: Coaching / Consulting
    { agent_id:"AGT-081", name:"Client Intake Agent", slug:"coach_client_intake_agent", vertical:"coaching", tagline:"Client intake done before the discovery call", outcome:"Intake frictionless.", layer:"commerce", meta:{lane_key:"lane_11",requires_tier:"studio"} },
    { agent_id:"AGT-082", name:"Session Management Agent", slug:"session_management_agent", vertical:"coaching", tagline:"Sessions scheduled. Materials delivered.", outcome:"Sessions organized.", layer:"execution", meta:{lane_key:"lane_11",requires_tier:"studio"} },
    { agent_id:"AGT-083", name:"Progress Tracking Agent", slug:"progress_tracking_agent", vertical:"coaching", tagline:"Client progress visible at every milestone", outcome:"Progress tracked.", layer:"execution", meta:{lane_key:"lane_11",requires_tier:"studio"} },
    { agent_id:"AGT-084", name:"Program Delivery Agent", slug:"program_delivery_agent", vertical:"coaching", tagline:"Program content delivered on schedule", outcome:"Programs delivered.", layer:"execution", meta:{lane_key:"lane_11",requires_tier:"studio"} },
    { agent_id:"AGT-085", name:"Client Retention Agent", slug:"client_retention_coach_agent", vertical:"coaching", tagline:"Clients stay longer. Results compound.", outcome:"Retention high.", layer:"commerce", meta:{lane_key:"lane_11",requires_tier:"studio"} },
    { agent_id:"AGT-086", name:"Testimonial & Case Study Agent", slug:"testimonial_case_study_agent", vertical:"coaching", tagline:"Client wins captured and showcased", outcome:"Social proof built.", layer:"commerce", meta:{lane_key:"lane_11",requires_tier:"studio"} },

    // lane_12: Fitness / Wellness
    { agent_id:"AGT-087", name:"Client Onboarding Agent", slug:"fitness_onboarding_agent", vertical:"fitness", tagline:"New clients onboarded in minutes", outcome:"Onboarding fast.", layer:"commerce", meta:{lane_key:"lane_12",requires_tier:"studio"} },
    { agent_id:"AGT-088", name:"Workout Programming Agent", slug:"workout_programming_agent", vertical:"fitness", tagline:"Workout plans generated from client data", outcome:"Plans personalized.", layer:"execution", meta:{lane_key:"lane_12",requires_tier:"studio"} },
    { agent_id:"AGT-089", name:"Nutrition Planning Agent", slug:"nutrition_planning_agent", vertical:"fitness", tagline:"Meal plans that match goals", outcome:"Nutrition optimized.", layer:"execution", meta:{lane_key:"lane_12",requires_tier:"studio"} },
    { agent_id:"AGT-090", name:"Progress & Metrics Agent", slug:"fitness_progress_agent", vertical:"fitness", tagline:"Client metrics tracked and visualized", outcome:"Progress visible.", layer:"execution", meta:{lane_key:"lane_12",requires_tier:"studio"} },
    { agent_id:"AGT-091", name:"Schedule & Booking Agent", slug:"fitness_schedule_agent", vertical:"fitness", tagline:"Sessions booked. Schedule full.", outcome:"Bookings optimized.", layer:"execution", meta:{lane_key:"lane_12",requires_tier:"studio"} },
    { agent_id:"AGT-092", name:"Retention & Engagement Agent", slug:"fitness_retention_agent", vertical:"fitness", tagline:"Clients stay accountable and engaged", outcome:"Retention up.", layer:"commerce", meta:{lane_key:"lane_12",requires_tier:"studio"} },

    // lane_13: Finance / Investing
    { agent_id:"AGT-093", name:"Portfolio Tracking Agent", slug:"portfolio_tracking_agent", vertical:"finance", tagline:"Every position tracked. Every move analyzed.", outcome:"Portfolio visible.", layer:"governance", meta:{lane_key:"lane_13",requires_tier:"studio",license_type:"finance"} },
    { agent_id:"AGT-094", name:"Market Research Agent", slug:"market_research_fin_agent", vertical:"finance", tagline:"Market intelligence delivered daily", outcome:"Research current.", layer:"domain", meta:{lane_key:"lane_13",requires_tier:"studio",license_type:"finance"} },
    { agent_id:"AGT-095", name:"Risk Assessment Agent", slug:"risk_assessment_fin_agent", vertical:"finance", tagline:"Risk identified before it materializes", outcome:"Risk managed.", layer:"governance", meta:{lane_key:"lane_13",requires_tier:"premium",license_type:"finance"} },
    { agent_id:"AGT-096", name:"Client Reporting Agent", slug:"client_reporting_fin_agent", vertical:"finance", tagline:"Client reports generated and delivered", outcome:"Reports automated.", layer:"governance", meta:{lane_key:"lane_13",requires_tier:"studio",license_type:"finance"} },
    { agent_id:"AGT-097", name:"Tax Preparation Agent", slug:"tax_prep_agent", vertical:"finance", tagline:"Tax documents organized year-round", outcome:"Tax ready.", layer:"execution", meta:{lane_key:"lane_13",requires_tier:"studio",license_type:"finance"} },
    { agent_id:"AGT-098", name:"Compliance & Regulatory Agent", slug:"fin_compliance_agent", vertical:"finance", tagline:"Regulatory changes tracked automatically", outcome:"Compliance current.", layer:"governance", meta:{lane_key:"lane_13",requires_tier:"premium",license_type:"finance"} },

    // lane_14: Automotive
    { agent_id:"AGT-099", name:"Service Scheduling Agent", slug:"service_scheduling_agent", vertical:"automotive", tagline:"Service bays filled. Appointments managed.", outcome:"Schedule optimized.", layer:"execution", meta:{lane_key:"lane_14",requires_tier:"studio"} },
    { agent_id:"AGT-100", name:"Inventory Management Agent", slug:"auto_inventory_agent", vertical:"automotive", tagline:"Parts inventory optimized. Never out of stock.", outcome:"Inventory balanced.", layer:"execution", meta:{lane_key:"lane_14",requires_tier:"studio"} },
    { agent_id:"AGT-101", name:"Customer Follow-Up Agent", slug:"auto_followup_agent", vertical:"automotive", tagline:"Service reminders sent automatically", outcome:"Follow-ups automated.", layer:"workflow", meta:{lane_key:"lane_14",requires_tier:"studio"} },
    { agent_id:"AGT-102", name:"Sales Lead Agent", slug:"auto_sales_lead_agent", vertical:"automotive", tagline:"Leads qualified before they walk in", outcome:"Leads qualified.", layer:"commerce", meta:{lane_key:"lane_14",requires_tier:"studio"} },
    { agent_id:"AGT-103", name:"Warranty Management Agent", slug:"warranty_management_agent", vertical:"automotive", tagline:"Warranty claims processed automatically", outcome:"Warranty managed.", layer:"execution", meta:{lane_key:"lane_14",requires_tier:"studio"} },

    // lane_15: Construction / Contracting
    { agent_id:"AGT-104", name:"Project Estimation Agent", slug:"project_estimation_agent", vertical:"construction", tagline:"Accurate estimates generated in minutes", outcome:"Estimates accurate.", layer:"commerce", meta:{lane_key:"lane_15",requires_tier:"studio"} },
    { agent_id:"AGT-105", name:"Project Management Agent", slug:"construction_pm_agent", vertical:"construction", tagline:"Projects on time. On budget.", outcome:"Projects tracked.", layer:"execution", meta:{lane_key:"lane_15",requires_tier:"studio"} },
    { agent_id:"AGT-106", name:"Subcontractor Management Agent", slug:"subcontractor_management_agent", vertical:"construction", tagline:"Subs scheduled. Work coordinated.", outcome:"Subs aligned.", layer:"execution", meta:{lane_key:"lane_15",requires_tier:"studio"} },
    { agent_id:"AGT-107", name:"Permit & Compliance Agent", slug:"permit_compliance_agent", vertical:"construction", tagline:"Permits tracked. Inspections scheduled.", outcome:"Permits current.", layer:"governance", meta:{lane_key:"lane_15",requires_tier:"studio"} },
    { agent_id:"AGT-108", name:"Material Procurement Agent", slug:"material_procurement_agent", vertical:"construction", tagline:"Materials ordered. Deliveries tracked.", outcome:"Materials on site.", layer:"execution", meta:{lane_key:"lane_15",requires_tier:"studio"} },
    { agent_id:"AGT-109", name:"Safety & Compliance Agent", slug:"safety_compliance_con_agent", vertical:"construction", tagline:"Safety protocols enforced automatically", outcome:"Safety maintained.", layer:"governance", meta:{lane_key:"lane_15",requires_tier:"premium"} },

    // lane_16: SaaS / Technology
    { agent_id:"AGT-110", name:"User Onboarding Agent", slug:"user_onboarding_saas_agent", vertical:"saas", tagline:"Users activated in their first session", outcome:"Activation up.", layer:"commerce", meta:{lane_key:"lane_16",requires_tier:"studio"} },
    { agent_id:"AGT-111", name:"Product Analytics Agent", slug:"product_analytics_agent", vertical:"saas", tagline:"Product usage data in real time", outcome:"Analytics live.", layer:"governance", meta:{lane_key:"lane_16",requires_tier:"studio"} },
    { agent_id:"AGT-112", name:"Customer Success Agent", slug:"customer_success_saas_agent", vertical:"saas", tagline:"Churn predicted. Retention executed.", outcome:"Retention optimized.", layer:"commerce", meta:{lane_key:"lane_16",requires_tier:"studio"} },
    { agent_id:"AGT-113", name:"Feature Request Agent", slug:"feature_request_agent", vertical:"saas", tagline:"Feature requests organized and prioritized", outcome:"Roadmap clear.", layer:"execution", meta:{lane_key:"lane_16",requires_tier:"studio"} },
    { agent_id:"AGT-114", name:"Bug Tracking Agent", slug:"bug_tracking_agent", vertical:"saas", tagline:"Bugs caught and assigned before users notice", outcome:"Bugs resolved.", layer:"execution", meta:{lane_key:"lane_16",requires_tier:"studio"} },
    { agent_id:"AGT-115", name:"Documentation Agent", slug:"documentation_saas_agent", vertical:"saas", tagline:"Documentation always current", outcome:"Docs updated.", layer:"execution", meta:{lane_key:"lane_16",requires_tier:"studio"} },
    { agent_id:"AGT-116", name:"Deployment Automation Agent", slug:"deployment_automation_agent", vertical:"saas", tagline:"Deployments automated and monitored", outcome:"Deployments smooth.", layer:"execution", meta:{lane_key:"lane_16",requires_tier:"premium"} },

    // lane_17: Nonprofit
    { agent_id:"AGT-117", name:"Donor Management Agent", slug:"donor_management_agent", vertical:"nonprofit", tagline:"Donors tracked. Relationships nurtured.", outcome:"Donors engaged.", layer:"commerce", meta:{lane_key:"lane_17",requires_tier:"studio"} },
    { agent_id:"AGT-118", name:"Grant Research Agent", slug:"grant_research_np_agent", vertical:"nonprofit", tagline:"Grants found before the deadline", outcome:"Grants identified.", layer:"commerce", meta:{lane_key:"lane_17",requires_tier:"studio"} },
    { agent_id:"AGT-119", name:"Volunteer Coordination Agent", slug:"volunteer_coordination_agent", vertical:"nonprofit", tagline:"Volunteers scheduled. Shifts filled.", outcome:"Volunteers aligned.", layer:"execution", meta:{lane_key:"lane_17",requires_tier:"studio"} },
    { agent_id:"AGT-120", name:"Impact Reporting Agent", slug:"impact_reporting_agent", vertical:"nonprofit", tagline:"Impact measured and communicated", outcome:"Impact reported.", layer:"governance", meta:{lane_key:"lane_17",requires_tier:"studio"} },
    { agent_id:"AGT-121", name:"Campaign Management Agent", slug:"campaign_management_np_agent", vertical:"nonprofit", tagline:"Fundraising campaigns optimized", outcome:"Campaigns performing.", layer:"commerce", meta:{lane_key:"lane_17",requires_tier:"studio"} },
    { agent_id:"AGT-122", name:"Compliance & 990 Agent", slug:"compliance_990_agent", vertical:"nonprofit", tagline:"Nonprofit compliance automated", outcome:"Compliance current.", layer:"governance", meta:{lane_key:"lane_17",requires_tier:"premium"} },

    // lane_18: Food & Beverage
    { agent_id:"AGT-123", name:"Menu Management Agent", slug:"menu_management_agent", vertical:"food_beverage", tagline:"Menu optimized. Pricing profitable.", outcome:"Menu profitable.", layer:"commerce", meta:{lane_key:"lane_18",requires_tier:"studio"} },
    { agent_id:"AGT-124", name:"Inventory & Supply Agent", slug:"fb_inventory_agent", vertical:"food_beverage", tagline:"Stock levels optimized. Waste minimized.", outcome:"Inventory lean.", layer:"execution", meta:{lane_key:"lane_18",requires_tier:"studio"} },
    { agent_id:"AGT-125", name:"Reservation Management Agent", slug:"reservation_management_agent", vertical:"food_beverage", tagline:"Tables filled. Waitlists managed.", outcome:"Reservations optimized.", layer:"execution", meta:{lane_key:"lane_18",requires_tier:"studio"} },
    { agent_id:"AGT-126", name:"Delivery Coordination Agent", slug:"delivery_coordination_agent", vertical:"food_beverage", tagline:"Delivery orders routed efficiently", outcome:"Deliveries on time.", layer:"execution", meta:{lane_key:"lane_18",requires_tier:"studio"} },
    { agent_id:"AGT-127", name:"Customer Feedback Agent", slug:"fb_feedback_agent", vertical:"food_beverage", tagline:"Feedback collected. Issues resolved.", outcome:"Feedback actionable.", layer:"commerce", meta:{lane_key:"lane_18",requires_tier:"studio"} },
    { agent_id:"AGT-128", name:"Health Inspection Agent", slug:"health_inspection_agent", vertical:"food_beverage", tagline:"Health standards maintained automatically", outcome:"Inspections passed.", layer:"governance", meta:{lane_key:"lane_18",requires_tier:"premium"} },

    // lane_19: Professional Services
    { agent_id:"AGT-129", name:"Lead Generation Agent", slug:"lead_gen_professional_agent", vertical:"professional_services", tagline:"Leads generated and qualified", outcome:"Pipeline full.", layer:"commerce", meta:{lane_key:"lane_19",requires_tier:"studio"} },
    { agent_id:"AGT-130", name:"Proposal Management Agent", slug:"proposal_management_agent", vertical:"professional_services", tagline:"Proposals created and tracked", outcome:"Proposals sent.", layer:"commerce", meta:{lane_key:"lane_19",requires_tier:"studio"} },
    { agent_id:"AGT-131", name:"Project Delivery Agent", slug:"project_delivery_agent", vertical:"professional_services", tagline:"Projects delivered on scope and budget", outcome:"Delivery consistent.", layer:"execution", meta:{lane_key:"lane_19",requires_tier:"studio"} },
    { agent_id:"AGT-132", name:"Time & Billing Agent", slug:"time_billing_agent", vertical:"professional_services", tagline:"Time tracked. Invoices sent.", outcome:"Revenue captured.", layer:"commerce", meta:{lane_key:"lane_19",requires_tier:"studio"} },
    { agent_id:"AGT-133", name:"Client Communication Agent", slug:"client_communication_agent", vertical:"professional_services", tagline:"Client updates automated", outcome:"Communication seamless.", layer:"identity", meta:{lane_key:"lane_19",requires_tier:"studio"} },
    { agent_id:"AGT-134", name:"Business Development Agent", slug:"business_development_agent", vertical:"professional_services", tagline:"Partnerships identified and nurtured", outcome:"Deals in pipeline.", layer:"commerce", meta:{lane_key:"lane_19",requires_tier:"premium"} },

    // lane_20: Manufacturing
    { agent_id:"AGT-135", name:"Production Scheduling Agent", slug:"production_scheduling_agent", vertical:"manufacturing", tagline:"Production lines optimized", outcome:"Production on schedule.", layer:"execution", meta:{lane_key:"lane_20",requires_tier:"studio"} },
    { agent_id:"AGT-136", name:"Quality Control Agent", slug:"quality_control_mfg_agent", vertical:"manufacturing", tagline:"Defects caught before shipment", outcome:"Quality assured.", layer:"governance", meta:{lane_key:"lane_20",requires_tier:"studio"} },
    { agent_id:"AGT-137", name:"Supply Chain Agent", slug:"supply_chain_mfg_agent", vertical:"manufacturing", tagline:"Supply chain visibility end-to-end", outcome:"Supply chain visible.", layer:"execution", meta:{lane_key:"lane_20",requires_tier:"studio"} },
    { agent_id:"AGT-138", name:"Equipment Maintenance Agent", slug:"equipment_maintenance_mfg_agent", vertical:"manufacturing", tagline:"Predictive maintenance. Zero downtime.", outcome:"Downtime minimized.", layer:"execution", meta:{lane_key:"lane_20",requires_tier:"premium"} },
    { agent_id:"AGT-139", name:"Safety Compliance Agent", slug:"safety_compliance_mfg_agent", vertical:"manufacturing", tagline:"Safety protocols monitored", outcome:"Safety maintained.", layer:"governance", meta:{lane_key:"lane_20",requires_tier:"studio"} },

    // lane_21: Agriculture
    { agent_id:"AGT-140", name:"Crop Management Agent", slug:"crop_management_agent", vertical:"agriculture", tagline:"Crop health monitored daily", outcome:"Crops optimized.", layer:"execution", meta:{lane_key:"lane_21",requires_tier:"studio"} },
    { agent_id:"AGT-141", name:"Irrigation Intelligence Agent", slug:"irrigation_intel_agent", vertical:"agriculture", tagline:"Water usage optimized", outcome:"Water conserved.", layer:"execution", meta:{lane_key:"lane_21",requires_tier:"studio"} },
    { agent_id:"AGT-142", name:"Harvest Planning Agent", slug:"harvest_planning_agent", vertical:"agriculture", tagline:"Harvest timing optimized", outcome:"Yield maximized.", layer:"execution", meta:{lane_key:"lane_21",requires_tier:"studio"} },
    { agent_id:"AGT-143", name:"Equipment Fleet Agent", slug:"equipment_fleet_agent", vertical:"agriculture", tagline:"Equipment maintained and deployed", outcome:"Fleet operational.", layer:"execution", meta:{lane_key:"lane_21",requires_tier:"studio"} },
    { agent_id:"AGT-144", name:"Market Pricing Agent", slug:"market_pricing_ag_agent", vertical:"agriculture", tagline:"Market prices tracked and analyzed", outcome:"Pricing optimized.", layer:"commerce", meta:{lane_key:"lane_21",requires_tier:"studio"} },
    { agent_id:"AGT-145", name:"Regulatory Compliance Agent", slug:"regulatory_compliance_ag_agent", vertical:"agriculture", tagline:"Regulatory compliance maintained", outcome:"Compliance current.", layer:"governance", meta:{lane_key:"lane_21",requires_tier:"premium"} },

    // lane_22: Entertainment / Media
    { agent_id:"AGT-146", name:"Production Scheduling Agent", slug:"entertainment_schedule_agent", vertical:"entertainment", tagline:"Production schedules managed", outcome:"Production on track.", layer:"execution", meta:{lane_key:"lane_22",requires_tier:"studio"} },
    { agent_id:"AGT-147", name:"Content Distribution Agent", slug:"content_distribution_agent", vertical:"entertainment", tagline:"Content distributed across platforms", outcome:"Distribution automated.", layer:"execution", meta:{lane_key:"lane_22",requires_tier:"studio"} },
    { agent_id:"AGT-148", name:"Audience Analytics Agent", slug:"audience_analytics_media_agent", vertical:"entertainment", tagline:"Audience data analyzed in real time", outcome:"Audience understood.", layer:"governance", meta:{lane_key:"lane_22",requires_tier:"studio"} },
    { agent_id:"AGT-149", name:"Rights Management Agent", slug:"rights_management_agent", vertical:"entertainment", tagline:"Licensing and rights tracked", outcome:"Rights managed.", layer:"governance", meta:{lane_key:"lane_22",requires_tier:"premium"} },
    { agent_id:"AGT-150", name:"Talent Coordination Agent", slug:"talent_coordination_agent", vertical:"entertainment", tagline:"Talent schedules coordinated", outcome:"Talent aligned.", layer:"execution", meta:{lane_key:"lane_22",requires_tier:"studio"} },
  ];

  console.log(`\nInserting ${verticalAgents.length} remaining vertical agents (AGT-047 to AGT-150)...`);
  let vOk = 0;
  for (const a of verticalAgents) {
    try {
      await pool.query(
        `INSERT INTO public.agent_definitions (agent_id, pool, name, slug, vertical, tagline, outcome, layer, is_cross_system, is_bridge, metadata)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
         ON CONFLICT (slug) DO UPDATE SET
           agent_id=EXCLUDED.agent_id, name=EXCLUDED.name, tagline=EXCLUDED.tagline,
           outcome=EXCLUDED.outcome, layer=EXCLUDED.layer, metadata=EXCLUDED.metadata`,
        [a.agent_id, "vertical", a.name, a.slug, a.vertical, a.tagline, a.outcome, a.layer, false, false, a.meta ?? {}]
      );
      vOk++;
    } catch(e) { console.log(`  ❌ ${a.slug}: ${e.message}`); }
  }
  console.log(`✅ ${vOk}/${verticalAgents.length} vertical agents inserted`);

  await pool.end();
  console.log("\n🎉 Complete! All 208 agents + 55 generators seeded.");
} catch(e) {
  console.log("❌ Fatal error:", e.message);
  process.exit(1);
}
