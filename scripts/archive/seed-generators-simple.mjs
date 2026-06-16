import { readFileSync } from "fs";
import pg from "pg";

const env = readFileSync(".env.local", "utf8");
const sk = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/m)?.[1]?.replace(/["']/g, "").trim();
const su = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/m)?.[1]?.replace(/["']/g, "").trim();
const ref = su.match(/https?:\/\/(.+)\.supabase\.co/)?.[1];

// Try pooler with service role key as password (works on some Supabase setups)
const poolerUrl = `postgresql://postgres.${ref}:${encodeURIComponent(sk)}@aws-0-us-west-1.pooler.supabase.com:6543/postgres`;

console.log("Connecting to pooler...");
const pool = new pg.Pool({ connectionString: poolerUrl, max: 1, connectionTimeoutMillis: 15000 });

try {
  await pool.query("SELECT 1");
  console.log("✅ Connected via pooler");

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
  console.log("✅ RLS policies set");

  // Insert 55 generators
  const gens = [
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
    ["GEN-042","Checklist Generator","checklist_gen","Generates checklists for any process","execution"],
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

  let ok = 0;
  for (const [gid, name, slug, desc, layer] of gens) {
    try {
      await pool.query(
        `INSERT INTO public.generators (gen_id, name, slug, description, layer)
         VALUES ($1,$2,$3,$4,$5)
         ON CONFLICT (slug) DO UPDATE SET name=EXCLUDED.name, description=EXCLUDED.description, layer=EXCLUDED.layer`,
        [gid, name, slug, desc, layer]
      );
      ok++;
    } catch(e) { console.log(`  ❌ ${slug}: ${e.message}`); }
  }
  console.log(`✅ ${ok}/${gens.length} generators inserted`);
  await pool.end();
} catch(e) {
  console.log("❌ Pooler error:", e.message);
  console.log("\nPlease run this SQL in Supabase Dashboard:\nhttps://supabase.com/dashboard/project/" + ref + "/sql/new");
  console.log("\n─── SQL TO RUN ───\n");
  console.log("CREATE TABLE IF NOT EXISTS public.generators (");
  console.log("  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),");
  console.log("  gen_id text NOT NULL,");
  console.log("  name text NOT NULL,");
  console.log("  slug text UNIQUE NOT NULL,");
  console.log("  description text,");
  console.log("  layer text,");
  console.log("  is_active boolean DEFAULT true,");
  console.log("  created_at timestamptz DEFAULT now(),");
  console.log("  updated_at timestamptz DEFAULT now()");
  console.log(");");
  console.log("ALTER TABLE public.generators ENABLE ROW LEVEL SECURITY;");
  console.log('CREATE POLICY "allow_read" ON public.generators FOR SELECT USING (true);');
  console.log('CREATE POLICY "service_all" ON public.generators FOR ALL USING (true) WITH CHECK (true);');
  for (const [gid, name, slug, desc, layer] of gens) {
    console.log(`INSERT INTO public.generators (gen_id, name, slug, description, layer) VALUES ('${gid}', '${name}', '${slug}', '${desc}', '${layer}') ON CONFLICT (slug) DO NOTHING;`);
  }
}
