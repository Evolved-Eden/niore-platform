// seed-generators.mjs — Create generators table + insert 55 generators
// Uses pg to connect via Supabase pooler

import { readFileSync } from "fs";
import pg from "pg";

const env = readFileSync(".env.local", "utf8");

// Try various env var names for the DB connection
const dbUrl = env.match(/LOCAL_DATABASE_URL=(.+)/m)?.[1]?.replace(/["']/g, "").trim()
  || env.match(/DATABASE_URL=(.+)/m)?.[1]?.replace(/["']/g, "").trim();

if (!dbUrl) {
  console.log("No DATABASE_URL found. Trying pooler with service role...");
  // Construct from known pooler info
  const su = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/m)?.[1]?.replace(/["']/g, "").trim();
  const ref = su?.match(/https?:\/\/(.+)\.supabase\.co/)?.[1];
  
  if (ref) {
    const poolerUrl = `postgresql://postgres.jebixydqpvsegvrtfmgm:${encodeURIComponent(env.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/m)?.[1]?.replace(/["']/g, "").trim() ?? '')}@aws-0-us-west-1.pooler.supabase.com:6543/postgres`;
    await runSql(poolerUrl);
  } else {
    console.log("Could not construct pooler URL");
    process.exit(1);
  }
} else {
  await runSql(dbUrl);
}

async function runSql(connectionString) {
  const pool = new pg.Pool({ connectionString, max: 1, connectionTimeoutMillis: 10000 });

  try {
    // Test connection
    const test = await pool.query("SELECT 1 as ok");
    console.log("✅ Connected to database");

    // Create generators table
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

    // RLS
    await pool.query(`ALTER TABLE public.generators ENABLE ROW LEVEL SECURITY;`);
    await pool.query(`CREATE POLICY IF NOT EXISTS "allow_read" ON public.generators FOR SELECT USING (true);`);
    await pool.query(`CREATE POLICY IF NOT EXISTS "service_all" ON public.generators FOR ALL USING (true) WITH CHECK (true);`);
    console.log("✅ RLS policies created");

    // Insert generators
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

    let ok = 0;
    for (const g of generators) {
      try {
        await pool.query(
          `INSERT INTO public.generators (gen_id, name, slug, description, layer)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (slug) DO UPDATE SET name=EXCLUDED.name, description=EXCLUDED.description, layer=EXCLUDED.layer`,
          [g.gen_id, g.name, g.slug, g.description, g.layer]
        );
        ok++;
      } catch (e) {
        console.log(`  ❌ ${g.slug}: ${e.message}`);
      }
    }
    console.log(`✅ ${ok}/${generators.length} generators inserted`);

    await pool.end();
  } catch (e) {
    console.log("❌ Database error:", e.message);
    process.exit(1);
  }
}
