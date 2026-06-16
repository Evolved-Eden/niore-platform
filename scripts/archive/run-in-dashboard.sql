-- ============================================================
-- Run this in Supabase Dashboard SQL Editor:
-- https://supabase.com/dashboard/project/jebixydqpvsegvrtfmgm/sql/new
-- ============================================================

-- Create generators table
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

-- RLS
ALTER TABLE public.generators ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_read" ON public.generators FOR SELECT USING (true);
CREATE POLICY "service_all" ON public.generators FOR ALL USING (true) WITH CHECK (true);

-- Insert all 55 generators
INSERT INTO public.generators (gen_id, name, slug, description, layer) VALUES
('GEN-001', 'Identity Blueprint Generator', 'identity_blueprint_gen', 'Generates a complete identity and positioning blueprint', 'identity'),
('GEN-002', 'Brand Foundation Generator', 'brand_foundation_gen', 'Produces the full brand kit: voice, values, visuals', 'identity'),
('GEN-003', 'Audience Definition Generator', 'audience_definition_gen', 'Maps ideal client avatar with psychographic depth', 'blueprint'),
('GEN-004', 'Content Strategy Generator', 'content_strategy_gen', 'Builds a 90-day content strategy from scratch', 'execution'),
('GEN-005', 'Social Posting System Generator', 'social_posting_gen', 'Creates platform-specific posting systems', 'execution'),
('GEN-006', 'Campaign Generator', 'campaign_gen', 'Generates full campaign briefs with creative direction', 'commerce'),
('GEN-007', 'Offer Stack Generator', 'offer_stack_gen', 'Produces tiered offer suites', 'commerce'),
('GEN-008', 'Sales Script Generator', 'sales_script_gen', 'Builds conversation scripts for every touchpoint', 'commerce'),
('GEN-009', 'Pricing Architecture Generator', 'pricing_arch_gen', 'Outputs optimal pricing models and tiers', 'commerce'),
('GEN-010', 'Automation Blueprint Generator', 'automation_blueprint_gen', 'Maps all automatable workflows in the business', 'execution'),
('GEN-011', 'Funnel Architecture Generator', 'funnel_arch_gen', 'Designs complete funnel structures', 'commerce'),
('GEN-012', 'SOP Generator', 'sop_gen', 'Produces SOPs for any business process', 'execution'),
('GEN-013', 'AI Twin Profile Generator', 'ai_twin_profile_gen', 'Generates AI twin personality and behavior profile', 'identity'),
('GEN-014', 'Prompt System Generator', 'prompt_system_gen', 'Builds custom prompt libraries and templates', 'execution'),
('GEN-015', 'Workflow Blueprint Generator', 'workflow_blueprint_gen', 'Designs workflow sequences for any process', 'execution'),
('GEN-016', 'Integration Map Generator', 'integration_map_gen', 'Maps all system integration requirements', 'blueprint'),
('GEN-017', 'Data Schema Generator', 'data_schema_gen', 'Generates data models and schemas', 'execution'),
('GEN-018', 'API Blueprint Generator', 'api_blueprint_gen', 'Designs API endpoints and contracts', 'execution'),
('GEN-019', 'Dashboard Generator', 'dashboard_gen', 'Generates KPI dashboards from metrics input', 'governance'),
('GEN-020', 'Report Template Generator', 'report_template_gen', 'Creates report templates for any audience', 'governance'),
('GEN-021', 'Email Sequence Generator', 'email_sequence_gen', 'Builds email sequences and drip campaigns', 'commerce'),
('GEN-022', 'Landing Page Generator', 'landing_page_gen', 'Generates landing page copy and structure', 'commerce'),
('GEN-023', 'Blog Post Generator', 'blog_post_gen', 'Produces SEO-optimized blog content', 'execution'),
('GEN-024', 'Video Script Generator', 'video_script_gen', 'Creates video scripts and storyboards', 'execution'),
('GEN-025', 'Newsletter Generator', 'newsletter_gen', 'Generates newsletter content and layouts', 'execution'),
('GEN-026', 'Social Post Generator', 'social_post_gen', 'Creates platform-specific social posts', 'execution'),
('GEN-027', 'Lead Magnet Generator', 'lead_magnet_gen', 'Generates lead magnets and opt-in offers', 'commerce'),
('GEN-028', 'Webinar Script Generator', 'webinar_script_gen', 'Builds webinar scripts and slide outlines', 'commerce'),
('GEN-029', 'Case Study Generator', 'case_study_gen', 'Produces client case studies', 'execution'),
('GEN-030', 'Proposal Generator', 'proposal_gen', 'Generates client proposals and pitches', 'commerce'),
('GEN-031', 'Contract Generator', 'contract_gen', 'Creates contract templates', 'governance'),
('GEN-032', 'Brief Generator', 'brief_gen', 'Generates creative and project briefs', 'execution'),
('GEN-033', 'Timeline Generator', 'timeline_gen', 'Produces project timelines', 'execution'),
('GEN-034', 'Budget Generator', 'budget_gen', 'Generates budget spreadsheets', 'commerce'),
('GEN-035', 'Hiring Brief Generator', 'hiring_brief_gen', 'Creates job descriptions and hiring briefs', 'execution'),
('GEN-036', 'Training Module Generator', 'training_module_gen', 'Builds training content and materials', 'execution'),
('GEN-037', 'FAQ Generator', 'faq_gen', 'Generates FAQ content', 'execution'),
('GEN-038', 'Product Description Generator', 'product_desc_gen', 'Creates product descriptions', 'commerce'),
('GEN-039', 'Testimonial Generator', 'testimonial_gen', 'Generates testimonial prompts', 'execution'),
('GEN-040', 'Survey Generator', 'survey_gen', 'Creates surveys and feedback forms', 'execution'),
('GEN-041', 'Scorecard Generator', 'scorecard_gen', 'Produces scoring and evaluation systems', 'governance'),
('GEN-042', 'Checklist Generator', 'checklist_gen', 'Generates checklists for any process', 'execution'),
('GEN-043', 'Swarm Configuration Generator', 'swarm_config_gen', 'Designs swarm configurations', 'execution'),
('GEN-044', 'Agent Prompt Generator', 'agent_prompt_gen', 'Generates agent system prompts', 'identity'),
('GEN-045', 'Permission Template Generator', 'permission_template_gen', 'Creates permission templates', 'governance'),
('GEN-046', 'Notification Template Generator', 'notification_template_gen', 'Builds notification templates', 'execution'),
('GEN-047', 'Brand Voice Generator', 'brand_voice_gen', 'Generates brand voice guidelines', 'identity'),
('GEN-048', 'Content Calendar Generator', 'content_calendar_gen', 'Creates content calendars', 'execution'),
('GEN-049', 'Competitive Analysis Generator', 'competitive_analysis_gen', 'Produces competitive analysis', 'blueprint'),
('GEN-050', 'Market Research Generator', 'market_research_gen', 'Generates market research reports', 'blueprint'),
('GEN-051', 'Risk Assessment Generator', 'risk_assessment_gen', 'Creates risk assessment matrices', 'governance'),
('GEN-052', 'Compliance Document Generator', 'compliance_doc_gen', 'Generates compliance documents', 'governance'),
('GEN-053', 'Migration Plan Generator', 'migration_plan_gen', 'Creates migration plans', 'execution'),
('GEN-054', 'Deployment Plan Generator', 'deployment_plan_gen', 'Generates deployment plans', 'execution'),
('GEN-055', 'Business Infrastructure Generator', 'biz_infra_gen', 'Produces business infrastructure blueprints', 'execution')
ON CONFLICT (slug) DO NOTHING;

-- Verify
SELECT 'Generators: ' || COUNT(*)::text FROM public.generators;
