/**
 * Seed blueprint template content (sections_json + template_json)
 * Run: node scripts/seed-blueprints.mjs
 * 
 * Populates the 3 existing blueprint_templates with rich assessment
 * content: questions, scoring domains, and recommendations.
 */
import pg from 'pg';

const PASSWORD = process.argv[2] || process.env.SUPABASE_DB_PASSWORD ;
const PROJECT_REF = 'jebixydqpvsegvrtfmgm';

const pool = new pg.Pool({
  host: `db.${PROJECT_REF}.supabase.co`, port: 5432, database: 'postgres',
  user: 'postgres', password: PASSWORD,
  ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 10000,
});

// ═══════════════════════════════════════════════════════════════
// Blueprint Content Definitions
// ═══════════════════════════════════════════════════════════════

const BLUEPRINTS = {

  // ── LUX MED SPA ────────────────────────────────────────────
  lux_medspa_blueprint: {
    vertical_key: 'beauty',
    subcategory_key: 'med_spa',
    name: 'Luxury Med Spa Intelligence Blueprint',
    description: 'Complete intelligence assessment for luxury medical spa operations, client experience, and growth optimization.',
    sections_json: [
      { key: 'business_profile', order: 1 },
      { key: 'services_offerings', order: 2 },
      { key: 'client_experience', order: 3 },
      { key: 'operations_workflow', order: 4 },
      { key: 'marketing_sales', order: 5 },
      { key: 'technology_stack', order: 6 },
      { key: 'team_staffing', order: 7 },
      { key: 'compliance_safety', order: 8 },
      { key: 'growth_scaling', order: 9 },
      { key: 'ai_readiness', order: 10 },
    ],
    template_json: {
      version: '1.0',
      sections: [
        {
          key: 'business_profile', title: 'Business Profile', order: 1,
          description: 'Tell us about your med spa business fundamentals.',
          questions: [
            { key: 'practice_age', type: 'select', label: 'How long has your med spa been operating?', required: true,
              options: [
                { value: 'startup', label: 'Less than 1 year', weight: 10 },
                { value: 'growing', label: '1-3 years', weight: 30 },
                { value: 'established', label: '3-7 years', weight: 60 },
                { value: 'mature', label: '7+ years', weight: 90 },
              ], domain: 'maturity' },
            { key: 'locations', type: 'select', label: 'How many locations do you operate?', required: true,
              options: [
                { value: '1', label: 'Single location', weight: 30 },
                { value: '2-3', label: '2-3 locations', weight: 60 },
                { value: '4-10', label: '4-10 locations', weight: 80 },
                { value: '10+', label: '10+ locations', weight: 100 },
              ], domain: 'scale' },
            { key: 'avg_ticket', type: 'select', label: 'What is your average client ticket?', required: true,
              options: [
                { value: 'under_200', label: 'Under $200', weight: 10 },
                { value: '200_500', label: '$200 - $500', weight: 40 },
                { value: '500_1500', label: '$500 - $1,500', weight: 70 },
                { value: '1500_plus', label: '$1,500+', weight: 100 },
              ], domain: 'revenue_quality' },
            { key: 'monthly_clients', type: 'select', label: 'Approximately how many clients per month?',
              options: [
                { value: 'under_50', label: 'Under 50', weight: 10 },
                { value: '50_200', label: '50 - 200', weight: 40 },
                { value: '200_500', label: '200 - 500', weight: 70 },
                { value: '500_plus', label: '500+', weight: 100 },
              ], domain: 'scale' },
            { key: 'primary_specialty', type: 'select', label: 'What is your primary specialty?', required: true,
              options: [
                { value: 'injectables', label: 'Injectables (Botox/Fillers)' },
                { value: 'laser', label: 'Laser & Light Therapies' },
                { value: 'body', label: 'Body Contouring' },
                { value: 'skin', label: 'Skin Health & Rejuvenation' },
                { value: 'iv', label: 'IV Therapy & Wellness' },
                { value: 'full_service', label: 'Full Service Med Spa' },
              ], domain: 'service_focus' },
          ]},
        {
          key: 'services_offerings', title: 'Services & Offerings', order: 2,
          description: 'Detail the range of services you provide.',
          questions: [
            { key: 'service_categories', type: 'multi_select', label: 'Which service categories do you offer?',
              options: [
                { value: 'injectables', label: 'Injectables', weight: 20 },
                { value: 'laser', label: 'Laser Treatments', weight: 20 },
                { value: 'body', label: 'Body Contouring', weight: 15 },
                { value: 'facials', label: 'Medical Facials', weight: 15 },
                { value: 'iv_therapy', label: 'IV Therapy', weight: 25 },
                { value: 'hormone', label: 'Hormone Therapy', weight: 30 },
                { value: 'wellness', label: 'Wellness Programs', weight: 25 },
                { value: 'hair_restoration', label: 'Hair Restoration', weight: 20 },
              ], domain: 'breadth' },
            { key: 'custom_packages', type: 'boolean', label: 'Do you offer customized treatment packages?',
              weight: 15, domain: 'sophistication' },
            { key: 'membership_model', type: 'select', label: 'Do you have a membership or subscription model?',
              options: [
                { value: 'none', label: 'No membership program', weight: 0 },
                { value: 'basic', label: 'Basic punch cards', weight: 30 },
                { value: 'tiered', label: 'Tiered membership tiers', weight: 60 },
                { value: 'comprehensive', label: 'Comprehensive VIP membership', weight: 100 },
              ], domain: 'revenue_quality' },
            { key: 'retail_products', type: 'select', label: 'Do you sell retail products?',
              options: [
                { value: 'none', label: 'No retail', weight: 0 },
                { value: 'minimal', label: 'Minimal (1-2 brands)', weight: 25 },
                { value: 'curated', label: 'Curated selection', weight: 50 },
                { value: 'comprehensive', label: 'Full retail experience', weight: 75 },
                { value: 'subscription', label: 'Subscription-based retail', weight: 100 },
              ], domain: 'revenue_quality' },
          ]},
        {
          key: 'client_experience', title: 'Client Experience', order: 3,
          description: 'How you manage the client journey from discovery to follow-up.',
          questions: [
            { key: 'booking_method', type: 'select', label: 'How do clients primarily book?',
              options: [
                { value: 'phone', label: 'Phone only', weight: 0 },
                { value: 'phone_online', label: 'Phone + Basic Online', weight: 30 },
                { value: 'online', label: 'Full Online Booking', weight: 60 },
                { value: 'concierge', label: 'Concierge + AI-assisted', weight: 100 },
              ], domain: 'client_experience' },
            { key: 'intake_process', type: 'select', label: 'How do you handle new client intake?',
              options: [
                { value: 'paper', label: 'Paper forms in-office', weight: 0 },
                { value: 'digital_basic', label: 'Digital forms (emailed)', weight: 30 },
                { value: 'digital_portal', label: 'Client portal with pre-appointment', weight: 60 },
                { value: 'automated', label: 'Fully automated digital onboarding', weight: 100 },
              ], domain: 'client_experience' },
            { key: 'consult_method', type: 'select', label: 'How do you conduct consultations?',
              options: [
                { value: 'in_person_only', label: 'In-person only', weight: 20 },
                { value: 'phone', label: 'Phone consultations', weight: 40 },
                { value: 'video', label: 'Video consultations', weight: 60 },
                { value: 'ai_augmented', label: 'AI-augmented virtual consults', weight: 100 },
              ], domain: 'sophistication' },
            { key: 'follow_up_system', type: 'select', label: 'Do you have a systematic follow-up process?',
              options: [
                { value: 'none', label: 'No formal follow-up', weight: 0 },
                { value: 'manual', label: 'Manual follow-up by staff', weight: 25 },
                { value: 'automated_basic', label: 'Automated email/SMS', weight: 50 },
                { value: 'automated_smart', label: 'Smart automated with personalization', weight: 75 },
                { value: 'ai_driven', label: 'AI-driven intelligent follow-up', weight: 100 },
              ], domain: 'client_experience' },
            { key: 'loyalty_program', type: 'boolean', label: 'Do you have a formal loyalty or rewards program?',
              weight: 20, domain: 'revenue_quality' },
            { key: 'feedback_collection', type: 'select', label: 'How do you collect client feedback?',
              options: [
                { value: 'none', label: 'Do not collect', weight: 0 },
                { value: 'occasional', label: 'Occasional surveys', weight: 20 },
                { value: 'automated', label: 'Automated post-visit surveys', weight: 50 },
                { value: 'continuous', label: 'Continuous feedback + sentiment analysis', weight: 100 },
              ], domain: 'client_experience' },
          ]},
        {
          key: 'operations_workflow', title: 'Operations & Workflow', order: 4,
          description: 'Your day-to-day operational processes and efficiency.',
          questions: [
            { key: 'scheduling_system', type: 'select', label: 'What scheduling system do you use?',
              options: [
                { value: 'manual', label: 'Manual/paper scheduling', weight: 0 },
                { value: 'basic_software', label: 'Basic scheduling software', weight: 30 },
                { value: 'full_practice', label: 'Full practice management system', weight: 60 },
                { value: 'integrated', label: 'Fully integrated with CRM + AI', weight: 100 },
              ], domain: 'tech_adoption' },
            { key: 'inventory_management', type: 'select', label: 'How do you manage inventory?',
              options: [
                { value: 'manual', label: 'Manual counts', weight: 0 },
                { value: 'spreadsheet', label: 'Spreadsheet-based', weight: 20 },
                { value: 'software', label: 'Inventory management software', weight: 55 },
                { value: 'automated', label: 'Automated with low-stock alerts', weight: 85 },
                { value: 'predictive', label: 'AI-driven predictive inventory', weight: 100 },
              ], domain: 'tech_adoption' },
            { key: 'appointment_reminders', type: 'select', label: 'How do you send appointment reminders?',
              options: [
                { value: 'none', label: 'No reminders', weight: 0 },
                { value: 'phone', label: 'Manual phone calls', weight: 15 },
                { value: 'sms', label: 'Automated SMS', weight: 40 },
                { value: 'multi_channel', label: 'Multi-channel (SMS + Email + App)', weight: 70 },
                { value: 'smart', label: 'Smart reminders with prep instructions', weight: 100 },
              ], domain: 'tech_adoption' },
            { key: 'cancellation_rate', type: 'select', label: 'What is your approximate no-show/cancellation rate?',
              options: [
                { value: 'under_5', label: 'Under 5%', weight: 100 },
                { value: '5_10', label: '5-10%', weight: 70 },
                { value: '10_20', label: '10-20%', weight: 40 },
                { value: 'over_20', label: 'Over 20%', weight: 10 },
              ], domain: 'operational_health' },
            { key: 'payment_processing', type: 'select', label: 'How do you handle payments?',
              options: [
                { value: 'terminal', label: 'Basic card terminal', weight: 20 },
                { value: 'pos', label: 'POS system', weight: 40 },
                { value: 'integrated', label: 'Integrated payment processing', weight: 65 },
                { value: 'flexible', label: 'Flexible (deposits, plans, memberships)', weight: 85 },
                { value: 'automated', label: 'Fully automated billing + financing', weight: 100 },
              ], domain: 'tech_adoption' },
          ]},
        {
          key: 'marketing_sales', title: 'Marketing & Sales', order: 5,
          description: 'Your client acquisition and retention strategies.',
          questions: [
            { key: 'acquisition_channels', type: 'multi_select', label: 'Which acquisition channels do you use?',
              options: [
                { value: 'google', label: 'Google Ads', weight: 15 },
                { value: 'social', label: 'Social Media (IG/FB/TT)', weight: 20 },
                { value: 'seo', label: 'SEO/Organic', weight: 25 },
                { value: 'referral', label: 'Referral Program', weight: 30 },
                { value: 'email', label: 'Email Marketing', weight: 20 },
                { value: 'partnerships', label: 'Local Partnerships', weight: 15 },
                { value: 'influencer', label: 'Influencer Collaborations', weight: 25 },
              ], domain: 'marketing_sophistication' },
            { key: 'crm_usage', type: 'select', label: 'Do you use a CRM system?',
              options: [
                { value: 'none', label: 'No CRM', weight: 0 },
                { value: 'spreadsheet', label: 'Spreadsheet tracking', weight: 15 },
                { value: 'basic_crm', label: 'Basic CRM', weight: 40 },
                { value: 'full_crm', label: 'Full CRM with automation', weight: 70 },
                { value: 'ai_crm', label: 'AI-powered CRM with predictions', weight: 100 },
              ], domain: 'tech_adoption' },
            { key: 'client_segmentation', type: 'select', label: 'Do you segment your clients?',
              options: [
                { value: 'none', label: 'No segmentation', weight: 0 },
                { value: 'basic', label: 'Basic (new vs returning)', weight: 20 },
                { value: 'service', label: 'By service type', weight: 40 },
                { value: 'value', label: 'By value/LTV', weight: 60 },
                { value: 'advanced', label: 'Advanced (behavior + value + propensity)', weight: 100 },
              ], domain: 'marketing_sophistication' },
            { key: 'retention_rate', type: 'select', label: 'What is your 6-month client retention rate?',
              options: [
                { value: 'under_20', label: 'Under 20%', weight: 0 },
                { value: '20_40', label: '20-40%', weight: 25 },
                { value: '40_60', label: '40-60%', weight: 50 },
                { value: '60_80', label: '60-80%', weight: 75 },
                { value: 'over_80', label: 'Over 80%', weight: 100 },
              ], domain: 'operational_health' },
          ]},
        {
          key: 'technology_stack', title: 'Technology Stack', order: 6,
          description: 'The tools and systems powering your business.',
          questions: [
            { key: 'practice_software', type: 'select', label: 'What practice management software do you use?',
              options: [
                { value: 'none', label: 'None / Manual', weight: 0 },
                { value: 'basic', label: 'Basic scheduling tool', weight: 20 },
                { value: 'dedicated', label: 'Dedicated med spa software', weight: 55 },
                { value: 'integrated', label: 'Full integrated platform', weight: 85 },
                { value: 'custom', label: 'Custom-built solution', weight: 100 },
              ], domain: 'tech_adoption' },
            { key: 'telehealth', type: 'boolean', label: 'Do you offer telehealth/virtual consultations?',
              weight: 20, domain: 'sophistication' },
            { key: 'data_analytics', type: 'select', label: 'How do you use data analytics?',
              options: [
                { value: 'none', label: 'Do not use analytics', weight: 0 },
                { value: 'basic_reports', label: 'Basic reports from software', weight: 25 },
                { value: 'dashboard', label: 'Business dashboard/KPIs', weight: 55 },
                { value: 'predictive', label: 'Predictive analytics', weight: 80 },
                { value: 'ai_driven', label: 'AI-driven insights & recommendations', weight: 100 },
              ], domain: 'sophistication' },
            { key: 'automation_level', type: 'scale', label: 'Rate your current level of business automation (1-10)',
              scaleMin: 1, scaleMax: 10, domain: 'tech_adoption',
              weight: 30, description: '1 = fully manual, 10 = fully automated' },
            { key: 'integration_quality', type: 'select', label: 'How well do your systems integrate?',
              options: [
                { value: 'none', label: 'No integration — all separate', weight: 0 },
                { value: 'partial', label: 'Some manual integration', weight: 25 },
                { value: 'good', label: 'Mostly integrated', weight: 55 },
                { value: 'seamless', label: 'Seamless integration', weight: 80 },
                { value: 'unified', label: 'Unified single platform', weight: 100 },
              ], domain: 'tech_adoption' },
          ]},
        {
          key: 'team_staffing', title: 'Team & Staffing', order: 7,
          description: 'Your team composition and management approach.',
          questions: [
            { key: 'team_size', type: 'select', label: 'How many total team members?',
              options: [
                { value: '1_3', label: '1-3 (Solo + assistant)', weight: 20 },
                { value: '4_10', label: '4-10', weight: 50 },
                { value: '11_30', label: '11-30', weight: 75 },
                { value: '30_plus', label: '30+', weight: 100 },
              ], domain: 'scale' },
            { key: 'provider_types', type: 'multi_select', label: 'Which provider types do you employ?',
              options: [
                { value: 'np', label: 'Nurse Practitioners', weight: 30 },
                { value: 'pa', label: 'Physician Assistants', weight: 20 },
                { value: 'rn', label: 'Registered Nurses', weight: 25 },
                { value: 'md', label: 'Medical Directors', weight: 30 },
                { value: 'esthetician', label: 'Licensed Estheticians', weight: 15 },
                { value: 'front_desk', label: 'Front Desk/Admin', weight: 10 },
              ], domain: 'breadth' },
            { key: 'training_program', type: 'boolean', label: 'Do you have a formal training program?',
              weight: 20, domain: 'maturity' },
            { key: 'staff_utilization', type: 'select', label: 'How is staff scheduling managed?',
              options: [
                { value: 'manual', label: 'Manual scheduling', weight: 0 },
                { value: 'spreadsheet', label: 'Spreadsheet-based', weight: 15 },
                { value: 'software', label: 'Staff scheduling software', weight: 50 },
                { value: 'optimized', label: 'AI-optimized scheduling', weight: 100 },
              ], domain: 'tech_adoption' },
          ]},
        {
          key: 'compliance_safety', title: 'Compliance & Safety', order: 8,
          description: 'Regulatory compliance and patient safety protocols.',
          questions: [
            { key: 'compliance_system', type: 'select', label: 'How do you manage compliance?',
              options: [
                { value: 'manual', label: 'Manual tracking', weight: 10 },
                { value: 'checklists', label: 'Paper checklists', weight: 25 },
                { value: 'software', label: 'Compliance software', weight: 60 },
                { value: 'automated', label: 'Automated compliance monitoring', weight: 100 },
              ], domain: 'maturity' },
            { key: 'consent_process', type: 'select', label: 'How do you manage patient consent?',
              options: [
                { value: 'paper', label: 'Paper consent forms', weight: 15 },
                { value: 'digital_basic', label: 'Digital consent (e-sign)', weight: 45 },
                { value: 'digital_automated', label: 'Digital + automated storage', weight: 70 },
                { value: 'integrated', label: 'Fully integrated with EHR', weight: 100 },
              ], domain: 'sophistication' },
            { key: 'incident_reporting', type: 'boolean', label: 'Do you have a formal incident reporting system?',
              weight: 25, domain: 'maturity' },
          ]},
        {
          key: 'growth_scaling', title: 'Growth & Scaling', order: 9,
          description: 'Your growth trajectory and scaling readiness.',
          questions: [
            { key: 'growth_stage', type: 'select', label: 'What is your current growth stage?',
              options: [
                { value: 'survival', label: 'Survival mode/filling chairs', weight: 5 },
                { value: 'stabilizing', label: 'Stabilizing operations', weight: 25 },
                { value: 'growing', label: 'Actively growing', weight: 55 },
                { value: 'scaling', label: 'Scaling operations', weight: 80 },
                { value: 'dominating', label: 'Market leader/expanding', weight: 100 },
              ], domain: 'growth_velocity' },
            { key: 'expansion_plans', type: 'multi_select', label: 'Which expansion paths interest you?',
              options: [
                { value: 'new_location', label: 'New Location', weight: 20 },
                { value: 'new_services', label: 'New Service Lines', weight: 25 },
                { value: 'med_spa', label: 'Add Medical Spa Services', weight: 30 },
                { value: 'franchise', label: 'Franchise Model', weight: 40 },
                { value: 'online', label: 'Online/Retail Expansion', weight: 20 },
                { value: 'partnership', label: 'Strategic Partnerships', weight: 25 },
              ], domain: 'ambition' },
            { key: 'funding_interest', type: 'boolean', label: 'Are you interested in funding or investment?',
              weight: 15, domain: 'ambition' },
            { key: 'biggest_challenge', type: 'select', label: 'What is your biggest operational challenge?',
              options: [
                { value: 'acquisition', label: 'Client acquisition', domain: 'challenge_focus' },
                { value: 'retention', label: 'Client retention/loyalty', domain: 'challenge_focus' },
                { value: 'staffing', label: 'Staffing/hiring', domain: 'challenge_focus' },
                { value: 'operations', label: 'Operational efficiency', domain: 'challenge_focus' },
                { value: 'technology', label: 'Technology adoption', domain: 'challenge_focus' },
                { value: 'competition', label: 'Competition/market saturation', domain: 'challenge_focus' },
              ]},
          ]},
        {
          key: 'ai_readiness', title: 'AI Readiness', order: 10,
          description: 'Your readiness to adopt AI-powered intelligence systems.',
          questions: [
            { key: 'ai_familiarity', type: 'select', label: 'How familiar are you with AI in business?',
              options: [
                { value: 'unfamiliar', label: 'Not familiar', weight: 0 },
                { value: 'aware', label: 'Aware but not using', weight: 20 },
                { value: 'experimenting', label: 'Experimenting with AI tools', weight: 50 },
                { value: 'implementing', label: 'Implementing AI solutions', weight: 75 },
                { value: 'advanced', label: 'Advanced AI integration', weight: 100 },
              ], domain: 'ai_readiness' },
            { key: 'data_quality', type: 'select', label: 'How would you rate your client data quality?',
              options: [
                { value: 'poor', label: 'Poor — disorganized/incomplete', weight: 0 },
                { value: 'fair', label: 'Fair — some structure', weight: 25 },
                { value: 'good', label: 'Good — mostly organized', weight: 55 },
                { value: 'excellent', label: 'Excellent — clean and structured', weight: 80 },
                { value: 'exceptional', label: 'Exceptional — enriched with insights', weight: 100 },
              ], domain: 'ai_readiness' },
            { key: 'ai_interest_areas', type: 'multi_select', label: 'Which AI applications interest you most?',
              options: [
                { value: 'booking', label: 'Smart Scheduling & Booking', weight: 20 },
                { value: 'marketing', label: 'AI Marketing & Personalization', weight: 25 },
                { value: 'insights', label: 'Client Insights & Predictions', weight: 30 },
                { value: 'automation', label: 'Workflow Automation', weight: 20 },
                { value: 'concierge', label: 'AI Concierge & Client Experience', weight: 35 },
                { value: 'analytics', label: 'Business Intelligence & Analytics', weight: 20 },
              ], domain: 'ai_readiness' },
            { key: 'digital_maturity', type: 'scale', label: 'Rate your overall digital maturity (1-10)',
              scaleMin: 1, scaleMax: 10, domain: 'tech_adoption',
              description: '1 = pen and paper, 10 = fully digital + AI' },
          ]},
      ],
      scoring: {
        domains: [
          { key: 'maturity', name: 'Business Maturity', weight: 10,
            thresholds: [
              { min: 0, label: 'Early Stage', agents: ['intake_consultation'], swarms: ['service_concierge_swarm'] },
              { min: 40, label: 'Growth Stage', agents: ['intake_consultation', 'lead_sales'], swarms: ['service_concierge_swarm', 'ops_internal_swarm'] },
              { min: 70, label: 'Established', agents: ['concierge_booking', 'lead_sales', 'intake_consultation'], swarms: ['service_concierge_swarm', 'ops_internal_swarm', 'financial_cfo_swarm'] },
            ]},
          { key: 'scale', name: 'Operational Scale', weight: 10,
            thresholds: [
              { min: 0, label: 'Single Location', agents: ['concierge_booking'], swarms: ['service_concierge_swarm'] },
              { min: 50, label: 'Multi-Location', agents: ['concierge_booking', 'enterprise_infrastructure'], swarms: ['service_concierge_swarm', 'ops_internal_swarm'] },
            ]},
          { key: 'revenue_quality', name: 'Revenue Quality', weight: 15,
            thresholds: [
              { min: 0, label: 'Transactional', agents: ['lead_sales'], swarms: ['service_concierge_swarm'] },
              { min: 40, label: 'Recurring Revenue', agents: ['lead_sales', 'creator_commerce'], swarms: ['service_concierge_swarm', 'financial_cfo_swarm'] },
              { min: 70, label: 'Premium Revenue', agents: ['concierge_booking', 'lead_sales', 'creator_commerce'], swarms: ['service_concierge_swarm', 'financial_cfo_swarm', 'executive_ops_swarm'] },
            ]},
          { key: 'client_experience', name: 'Client Experience', weight: 20,
            thresholds: [
              { min: 0, label: 'Basic Experience', agents: ['concierge_booking'], swarms: ['service_concierge_swarm'] },
              { min: 40, label: 'Polished Experience', agents: ['concierge_booking', 'intake_consultation'], swarms: ['service_concierge_swarm', 'health_wellness_swarm'] },
              { min: 70, label: 'Premium Experience', agents: ['concierge_booking', 'intake_consultation', 'lead_sales'], swarms: ['service_concierge_swarm', 'health_wellness_swarm', 'executive_ops_swarm'] },
            ]},
          { key: 'tech_adoption', name: 'Technology Adoption', weight: 15,
            thresholds: [
              { min: 0, label: 'Low Tech', agents: ['concierge_booking'], swarms: ['service_concierge_swarm'] },
              { min: 40, label: 'Moderate Tech', agents: ['concierge_booking', 'intake_consultation', 'integration_agent'], swarms: ['service_concierge_swarm', 'ops_internal_swarm'] },
              { min: 70, label: 'High Tech', agents: ['concierge_booking', 'intelligence_agent', 'integration_agent', 'forecasting_agent'], swarms: ['service_concierge_swarm', 'ops_internal_swarm', 'research_intelligence_swarm'] },
            ]},
          { key: 'marketing_sophistication', name: 'Marketing Sophistication', weight: 10,
            thresholds: [
              { min: 0, label: 'Basic Marketing', agents: ['lead_sales'], swarms: ['service_concierge_swarm'] },
              { min: 40, label: 'Growing Marketing', agents: ['lead_sales', 'creator_commerce'], swarms: ['service_concierge_swarm', 'creator_growth_swarm'] },
              { min: 70, label: 'Advanced Marketing', agents: ['lead_sales', 'creator_commerce', 'forecasting_agent'], swarms: ['service_concierge_swarm', 'creator_growth_swarm', 'research_intelligence_swarm'] },
            ]},
          { key: 'sophistication', name: 'Business Sophistication', weight: 10,
            thresholds: [
              { min: 0, label: 'Standard', agents: ['concierge_booking'], swarms: ['service_concierge_swarm'] },
              { min: 50, label: 'Sophisticated', agents: ['concierge_booking', 'intelligence_agent'], swarms: ['service_concierge_swarm', 'research_intelligence_swarm'] },
            ]},
          { key: 'ai_readiness', name: 'AI Readiness', weight: 10,
            thresholds: [
              { min: 0, label: 'AI Curious', agents: ['concierge_booking', 'intake_consultation'], swarms: ['service_concierge_swarm'] },
              { min: 40, label: 'AI Ready', agents: ['concierge_booking', 'intelligence_agent', 'forecasting_agent'], swarms: ['service_concierge_swarm', 'research_intelligence_swarm'] },
              { min: 70, label: 'AI Forward', agents: ['concierge_booking', 'intelligence_agent', 'forecasting_agent', 'integration_agent'], swarms: ['service_concierge_swarm', 'research_intelligence_swarm', 'meta_orchestration_swarm'] },
            ]},
        ],
      },
      recommendations: {
        agents: ['concierge_booking', 'lead_sales', 'intake_consultation', 'intelligence_agent'],
        swarms: ['service_concierge_swarm', 'ops_internal_swarm', 'health_wellness_swarm'],
        essenceTemplate: 'wellness_client_essence',
        risTemplate: 'beauty_ris',
      },
    },
  },

  // ── LUX HOTEL ──────────────────────────────────────────────
  lux_hotel_blueprint: {
    vertical_key: 'hospitality',
    subcategory_key: 'hotel',
    name: 'Luxury Hotel Intelligence Blueprint',
    description: 'Complete intelligence assessment for luxury hotel operations, guest experience, and revenue optimization.',
    sections_json: [
      { key: 'property_profile', order: 1 },
      { key: 'guest_experience', order: 2 },
      { key: 'operations', order: 3 },
      { key: 'revenue_management', order: 4 },
      { key: 'marketing_distribution', order: 5 },
      { key: 'technology', order: 6 },
      { key: 'staff_management', order: 7 },
      { key: 'growth_strategy', order: 8 },
      { key: 'ai_readiness', order: 9 },
    ],
    template_json: {
      version: '1.0',
      sections: [
        {
          key: 'property_profile', title: 'Property Profile', order: 1,
          description: 'Tell us about your property.',
          questions: [
            { key: 'property_type', type: 'select', label: 'What type of property?', required: true,
              options: [
                { value: 'boutique', label: 'Boutique Hotel (<50 rooms)', weight: 30 },
                { value: 'mid_size', label: 'Mid-Size Hotel (51-150 rooms)', weight: 55 },
                { value: 'large', label: 'Large Hotel (151-300 rooms)', weight: 80 },
                { value: 'resort', label: 'Luxury Resort (300+ rooms)', weight: 100 },
              ], domain: 'scale' },
            { key: 'star_rating', type: 'select', label: 'What is your star rating?', required: true,
              options: [
                { value: '3_star', label: '3 Star', weight: 20 },
                { value: '4_star', label: '4 Star', weight: 50 },
                { value: '5_star', label: '5 Star', weight: 80 },
                { value: 'ultra_luxury', label: 'Ultra-Luxury', weight: 100 },
              ], domain: 'service_level' },
            { key: 'years_operation', type: 'select', label: 'Years in operation?',
              options: [
                { value: 'under_2', label: 'Under 2 years', weight: 20 },
                { value: '2_5', label: '2-5 years', weight: 40 },
                { value: '5_15', label: '5-15 years', weight: 60 },
                { value: '15_plus', label: '15+ years', weight: 90 },
              ], domain: 'maturity' },
            { key: 'avg_daily_rate', type: 'select', label: 'Average daily rate?',
              options: [
                { value: 'under_200', label: 'Under $200', weight: 10 },
                { value: '200_400', label: '$200 - $400', weight: 35 },
                { value: '400_800', label: '$400 - $800', weight: 65 },
                { value: '800_plus', label: '$800+', weight: 100 },
              ], domain: 'revenue_quality' },
            { key: 'occupancy_rate', type: 'select', label: 'Average annual occupancy?',
              options: [
                { value: 'under_50', label: 'Under 50%', weight: 10 },
                { value: '50_65', label: '50-65%', weight: 40 },
                { value: '65_80', label: '65-80%', weight: 70 },
                { value: 'over_80', label: 'Over 80%', weight: 100 },
              ], domain: 'operational_health' },
          ]},
        {
          key: 'guest_experience', title: 'Guest Experience', order: 2,
          description: 'How you create memorable guest experiences.',
          questions: [
            { key: 'check_in', type: 'select', label: 'Check-in process?',
              options: [
                { value: 'traditional', label: 'Traditional front desk', weight: 15 },
                { value: 'express', label: 'Express check-in kiosk', weight: 40 },
                { value: 'mobile', label: 'Mobile check-in', weight: 65 },
                { value: 'seamless', label: 'Seamless/automatic check-in', weight: 100 },
              ], domain: 'guest_tech' },
            { key: 'concierge_service', type: 'select', label: 'Concierge service model?',
              options: [
                { value: 'desk', label: 'Physical concierge desk', weight: 30 },
                { value: 'phone', label: 'Phone-based concierge', weight: 45 },
                { value: 'digital', label: 'Digital concierge (app)', weight: 70 },
                { value: 'ai_augmented', label: 'AI-augmented concierge', weight: 100 },
              ], domain: 'service_level' },
            { key: 'personalization', type: 'select', label: 'How do you personalize guest stays?',
              options: [
                { value: 'none', label: 'No personalization', weight: 0 },
                { value: 'basic', label: 'Basic preferences (room type)', weight: 25 },
                { value: 'segmented', label: 'Segment-based personalization', weight: 55 },
                { value: 'individual', label: 'Individual preference tracking', weight: 80 },
                { value: 'predictive', label: 'AI predictive personalization', weight: 100 },
              ], domain: 'guest_experience' },
            { key: 'guest_feedback', type: 'select', label: 'How do you collect and act on guest feedback?',
              options: [
                { value: 'none', label: 'Do not collect', weight: 0 },
                { value: 'post_stay', label: 'Post-stay email survey', weight: 30 },
                { value: 'in_stay', label: 'In-stay feedback collection', weight: 60 },
                { value: 'real_time', label: 'Real-time sentiment monitoring', weight: 100 },
              ], domain: 'guest_experience' },
            { key: 'vip_program', type: 'boolean', label: 'Do you have a formal VIP/guest recognition program?',
              weight: 25, domain: 'service_level' },
          ]},
        {
          key: 'operations', title: 'Operations', order: 3,
          description: 'Your operational infrastructure.',
          questions: [
            { key: 'pms', type: 'select', label: 'Property Management System?',
              options: [
                { value: 'basic', label: 'Basic PMS', weight: 20 },
                { value: 'mid_range', label: 'Mid-range PMS', weight: 45 },
                { value: 'enterprise', label: 'Enterprise PMS', weight: 70 },
                { value: 'integrated', label: 'Fully integrated tech stack', weight: 100 },
              ], domain: 'tech_adoption' },
            { key: 'housekeeping_mgmt', type: 'select', label: 'Housekeeping management?',
              options: [
                { value: 'paper', label: 'Paper-based', weight: 0 },
                { value: 'radio', label: 'Radio/phone coordination', weight: 20 },
                { value: 'software', label: 'Housekeeping software', weight: 55 },
                { value: 'automated', label: 'Automated with IoT sensors', weight: 100 },
              ], domain: 'tech_adoption' },
            { key: 'maintenance_system', type: 'boolean', label: 'Do you have a preventive maintenance system?',
              weight: 20, domain: 'maturity' },
            { key: 'energy_management', type: 'select', label: 'Energy management approach?',
              options: [
                { value: 'none', label: 'No system', weight: 0 },
                { value: 'basic', label: 'Manual monitoring', weight: 20 },
                { value: 'system', label: 'Building management system', weight: 55 },
                { value: 'smart', label: 'Smart/IoT energy management', weight: 100 },
              ], domain: 'sophistication' },
          ]},
        {
          key: 'revenue_management', title: 'Revenue Management', order: 4,
          description: 'Your approach to pricing and revenue optimization.',
          questions: [
            { key: 'rev_management', type: 'select', label: 'Revenue management approach?',
              options: [
                { value: 'manual', label: 'Manual rate management', weight: 0 },
                { value: 'rule_based', label: 'Rule-based system', weight: 40 },
                { value: 'automated', label: 'Automated RMS', weight: 70 },
                { value: 'ai_driven', label: 'AI-driven dynamic pricing', weight: 100 },
              ], domain: 'revenue_sophistication' },
            { key: 'channels', type: 'multi_select', label: 'Distribution channels?',
              options: [
                { value: 'direct', label: 'Direct website', weight: 25 },
                { value: 'gds', label: 'GDS', weight: 15 },
                { value: 'ota', label: 'OTAs (Booking/Expedia)', weight: 20 },
                { value: 'wholesale', label: 'Wholesale/Tour Operators', weight: 10 },
                { value: 'corporate', label: 'Corporate/Business', weight: 20 },
                { value: 'social', label: 'Social/Instagram Booking', weight: 25 },
              ], domain: 'distribution' },
            { key: 'direct_percentage', type: 'select', label: 'What percentage of bookings are direct?',
              options: [
                { value: 'under_20', label: 'Under 20%', weight: 10 },
                { value: '20_40', label: '20-40%', weight: 30 },
                { value: '40_60', label: '40-60%', weight: 55 },
                { value: 'over_60', label: 'Over 60%', weight: 100 },
              ], domain: 'revenue_quality' },
            { key: 'upsell_program', type: 'boolean', label: 'Do you have automated upsell/ancillary programs?',
              weight: 25, domain: 'revenue_sophistication' },
          ]},
        {
          key: 'marketing_distribution', title: 'Marketing & Distribution', order: 5,
          description: 'How you attract and retain guests.',
          questions: [
            { key: 'crm_capability', type: 'select', label: 'Guest CRM capability?',
              options: [
                { value: 'none', label: 'No CRM', weight: 0 },
                { value: 'basic', label: 'Basic guest database', weight: 20 },
                { value: 'crm', label: 'Full CRM', weight: 55 },
                { value: 'advanced_crm', label: 'Advanced CRM with automation', weight: 80 },
                { value: 'ai_crm', label: 'AI-powered CRM', weight: 100 },
              ], domain: 'tech_adoption' },
            { key: 'email_marketing', type: 'boolean', label: 'Do you do targeted email marketing campaigns?',
              weight: 20, domain: 'marketing' },
            { key: 'social_presence', type: 'select', label: 'Social media presence?',
              options: [
                { value: 'minimal', label: 'Minimal presence', weight: 10 },
                { value: 'active', label: 'Active posting', weight: 35 },
                { value: 'engaged', label: 'Engaged community', weight: 60 },
                { value: 'influencer', label: 'Full influencer strategy', weight: 90 },
              ], domain: 'marketing' },
            { key: 'reputation_management', type: 'select', label: 'Reputation management?',
              options: [
                { value: 'none', label: 'Not actively managed', weight: 0 },
                { value: 'manual', label: 'Manual response', weight: 25 },
                { value: 'monitored', label: 'Monitored with alerts', weight: 55 },
                { value: 'proactive', label: 'Proactive reputation management', weight: 100 },
              ], domain: 'marketing' },
          ]},
        {
          key: 'technology', title: 'Technology', order: 6,
          description: 'Your technology infrastructure.',
          questions: [
            { key: 'property_wide_wifi', type: 'boolean', label: 'Property-wide high-speed WiFi?',
              weight: 15, domain: 'tech_adoption' },
            { key: 'guest_app', type: 'boolean', label: 'Do you have a guest mobile app?',
              weight: 30, domain: 'guest_tech' },
            { key: 'iot_adoption', type: 'select', label: 'IoT/smart room adoption?',
              options: [
                { value: 'none', label: 'No smart features', weight: 0 },
                { value: 'minimal', label: 'Minimal (smart TVs)', weight: 20 },
                { value: 'moderate', label: 'Moderate (room controls)', weight: 55 },
                { value: 'comprehensive', label: 'Comprehensive smart rooms', weight: 100 },
              ], domain: 'sophistication' },
            { key: 'data_analytics_hotel', type: 'select', label: 'Business intelligence capability?',
              options: [
                { value: 'none', label: 'No BI', weight: 0 },
                { value: 'basic', label: 'Basic reports', weight: 25 },
                { value: 'dashboard', label: 'BI dashboards', weight: 55 },
                { value: 'predictive', label: 'Predictive analytics', weight: 100 },
              ], domain: 'tech_adoption' },
          ]},
        {
          key: 'staff_management', title: 'Staff Management', order: 7,
          description: 'Your workforce management approach.',
          questions: [
            { key: 'staff_count', type: 'select', label: 'Number of employees?',
              options: [
                { value: 'under_20', label: 'Under 20', weight: 20 },
                { value: '20_50', label: '20-50', weight: 45 },
                { value: '50_200', label: '50-200', weight: 70 },
                { value: '200_plus', label: '200+', weight: 100 },
              ], domain: 'scale' },
            { key: 'staff_scheduling', type: 'select', label: 'Staff scheduling?',
              options: [
                { value: 'manual', label: 'Manual/schedule board', weight: 0 },
                { value: 'spreadsheet', label: 'Spreadsheet', weight: 15 },
                { value: 'software', label: 'Scheduling software', weight: 50 },
                { value: 'optimized', label: 'AI-optimized scheduling', weight: 100 },
              ], domain: 'tech_adoption' },
            { key: 'training_hr', type: 'select', label: 'Training and development?',
              options: [
                { value: 'none', label: 'No formal program', weight: 5 },
                { value: 'onboarding', label: 'Basic onboarding only', weight: 25 },
                { value: 'ongoing', label: 'Ongoing training program', weight: 55 },
                { value: 'comprehensive', label: 'Comprehensive L&D program', weight: 100 },
              ], domain: 'maturity' },
          ]},
        {
          key: 'growth_strategy', title: 'Growth Strategy', order: 8,
          description: 'Your growth and expansion plans.',
          questions: [
            { key: 'expansion_plan', type: 'select', label: 'Expansion plans?',
              options: [
                { value: 'maintain', label: 'Maintain current operations', weight: 10 },
                { value: 'renovate', label: 'Renovation/upgrade', weight: 35 },
                { value: 'expand', label: 'Add new property', weight: 60 },
                { value: 'portfolio', label: 'Build portfolio/multi-property', weight: 90 },
              ], domain: 'ambition' },
            { key: 'challenge_primary', type: 'select', label: 'Primary challenge?',
              options: [
                { value: 'occupancy', label: 'Occupancy/RevPAR', domain: 'challenge' },
                { value: 'staffing', label: 'Staffing shortages', domain: 'challenge' },
                { value: 'competition', label: 'Competition', domain: 'challenge' },
                { value: 'technology', label: 'Technology lag', domain: 'challenge' },
                { value: 'ota_dependence', label: 'OTA dependence', domain: 'challenge' },
              ]},
          ]},
        {
          key: 'ai_readiness_hotel', title: 'AI Readiness', order: 9,
          description: 'Your readiness for AI-powered hospitality.',
          questions: [
            { key: 'ai_interest', type: 'multi_select', label: 'Which AI applications interest you?',
              options: [
                { value: 'concierge', label: 'AI Concierge & Guest Service', weight: 30 },
                { value: 'pricing', label: 'Dynamic Pricing & Revenue', weight: 25 },
                { value: 'marketing_ai', label: 'AI Marketing & Personalization', weight: 25 },
                { value: 'operations_ai', label: 'Operations Automation', weight: 20 },
                { value: 'analytics_ai', label: 'Predictive Analytics', weight: 20 },
              ], domain: 'ai_readiness' },
            { key: 'ai_maturity', type: 'scale', label: 'Rate your AI/digital maturity (1-10)',
              scaleMin: 1, scaleMax: 10, weight: 30, domain: 'ai_readiness',
              description: '1 = traditional operations, 10 = fully AI-integrated' },
          ]},
      ],
      scoring: {
        domains: [
          { key: 'scale', name: 'Property Scale', weight: 10,
            thresholds: [
              { min: 0, label: 'Boutique', agents: ['concierge_booking'], swarms: ['service_concierge_swarm'] },
              { min: 55, label: 'Mid-Market', agents: ['concierge_booking', 'lead_sales'], swarms: ['service_concierge_swarm', 'ops_internal_swarm'] },
              { min: 80, label: 'Enterprise', agents: ['concierge_booking', 'lead_sales', 'enterprise_infrastructure'], swarms: ['service_concierge_swarm', 'ops_internal_swarm', 'executive_ops_swarm'] },
            ]},
          { key: 'service_level', name: 'Service Level', weight: 20,
            thresholds: [
              { min: 0, label: 'Standard Service', agents: ['concierge_booking'], swarms: ['service_concierge_swarm'] },
              { min: 50, label: 'Premium Service', agents: ['concierge_booking', 'intake_consultation'], swarms: ['service_concierge_swarm', 'executive_ops_swarm'] },
              { min: 80, label: 'Ultra-Luxury', agents: ['concierge_booking', 'intake_consultation', 'lead_sales'], swarms: ['service_concierge_swarm', 'executive_ops_swarm', 'multi_vertical_bridge_swarm'] },
            ]},
          { key: 'guest_experience', name: 'Guest Experience', weight: 20,
            thresholds: [
              { min: 0, label: 'Basic', agents: ['concierge_booking'], swarms: ['service_concierge_swarm'] },
              { min: 55, label: 'Personalized', agents: ['concierge_booking', 'intelligence_agent'], swarms: ['service_concierge_swarm', 'health_wellness_swarm'] },
            ]},
          { key: 'tech_adoption', name: 'Technology Adoption', weight: 15,
            thresholds: [
              { min: 0, label: 'Low Tech', agents: ['concierge_booking'], swarms: ['service_concierge_swarm'] },
              { min: 45, label: 'Moderate Tech', agents: ['concierge_booking', 'integration_agent'], swarms: ['service_concierge_swarm', 'ops_internal_swarm'] },
              { min: 70, label: 'High Tech', agents: ['concierge_booking', 'intelligence_agent', 'integration_agent', 'forecasting_agent'], swarms: ['service_concierge_swarm', 'ops_internal_swarm', 'research_intelligence_swarm'] },
            ]},
          { key: 'revenue_sophistication', name: 'Revenue Sophistication', weight: 15,
            thresholds: [
              { min: 0, label: 'Manual', agents: ['lead_sales'], swarms: ['service_concierge_swarm'] },
              { min: 40, label: 'Optimized', agents: ['lead_sales', 'forecasting_agent'], swarms: ['service_concierge_swarm', 'financial_cfo_swarm'] },
              { min: 70, label: 'AI-Driven', agents: ['lead_sales', 'forecasting_agent', 'intelligence_agent'], swarms: ['service_concierge_swarm', 'financial_cfo_swarm', 'research_intelligence_swarm'] },
            ]},
          { key: 'ai_readiness', name: 'AI Readiness', weight: 10,
            thresholds: [
              { min: 0, label: 'AI Curious', agents: ['concierge_booking'], swarms: ['service_concierge_swarm'] },
              { min: 45, label: 'AI Ready', agents: ['concierge_booking', 'intelligence_agent'], swarms: ['service_concierge_swarm', 'research_intelligence_swarm'] },
            ]},
        ],
      },
      recommendations: {
        agents: ['concierge_booking', 'lead_sales', 'intelligence_agent', 'forecasting_agent'],
        swarms: ['service_concierge_swarm', 'executive_ops_swarm', 'financial_cfo_swarm'],
        essenceTemplate: 'luxury_client_essence',
        risTemplate: 'luxury_ris',
      },
    },
  },

  // ── LUX REALTOR ────────────────────────────────────────────
  lux_realtor_blueprint: {
    vertical_key: 'real_estate',
    subcategory_key: 'realtor',
    name: 'Luxury Real Estate Intelligence Blueprint',
    description: 'Complete intelligence assessment for luxury real estate agents and brokerages.',
    sections_json: [
      { key: 'agent_profile', order: 1 },
      { key: 'portfolio', order: 2 },
      { key: 'lead_generation', order: 3 },
      { key: 'client_management', order: 4 },
      { key: 'marketing_brand', order: 5 },
      { key: 'transactions', order: 6 },
      { key: 'technology', order: 7 },
      { key: 'team_growth', order: 8 },
      { key: 'ai_readiness', order: 9 },
    ],
    template_json: {
      version: '1.0',
      sections: [
        {
          key: 'agent_profile', title: 'Agent Profile', order: 1,
          description: 'Tell us about your real estate business.',
          questions: [
            { key: 'experience_years', type: 'select', label: 'Years of experience?', required: true,
              options: [
                { value: 'under_2', label: 'Under 2 years', weight: 15 },
                { value: '2_5', label: '2-5 years', weight: 35 },
                { value: '5_10', label: '5-10 years', weight: 60 },
                { value: '10_plus', label: '10+ years', weight: 90 },
              ], domain: 'maturity' },
            { key: 'agent_volume', type: 'select', label: 'Annual transaction volume?', required: true,
              options: [
                { value: 'under_2m', label: 'Under $2M', weight: 10 },
                { value: '2m_5m', label: '$2M - $5M', weight: 30 },
                { value: '5m_20m', label: '$5M - $20M', weight: 60 },
                { value: '20m_50m', label: '$20M - $50M', weight: 85 },
                { value: 'over_50m', label: '$50M+', weight: 100 },
              ], domain: 'scale' },
            { key: 'team_or_solo', type: 'select', label: 'Do you work solo or with a team?',
              options: [
                { value: 'solo', label: 'Solo agent', weight: 20 },
                { value: 'small_team', label: 'Small team (2-5)', weight: 50 },
                { value: 'large_team', label: 'Large team (6-15)', weight: 75 },
                { value: 'brokerage', label: 'Full brokerage', weight: 100 },
              ], domain: 'scale' },
            { key: 'market_focus', type: 'select', label: 'Primary market focus?',
              options: [
                { value: 'residential', label: 'Residential', weight: 30 },
                { value: 'luxury', label: 'Luxury Residential', weight: 70 },
                { value: 'commercial', label: 'Commercial', weight: 50 },
                { value: 'land_dev', label: 'Land/Development', weight: 40 },
                { value: 'mixed', label: 'Mixed Portfolio', weight: 60 },
              ], domain: 'service_focus' },
            { key: 'avg_price_point', type: 'select', label: 'Average transaction price point?',
              options: [
                { value: 'under_300k', label: 'Under $300K', weight: 10 },
                { value: '300k_750k', label: '$300K - $750K', weight: 30 },
                { value: '750k_2m', label: '$750K - $2M', weight: 60 },
                { value: '2m_5m', label: '$2M - $5M', weight: 85 },
                { value: 'over_5m', label: '$5M+', weight: 100 },
              ], domain: 'revenue_quality' },
          ]},
        {
          key: 'portfolio', title: 'Portfolio & Listings', order: 2,
          description: 'Your current portfolio and listing management.',
          questions: [
            { key: 'current_listings', type: 'select', label: 'Current active listings?',
              options: [
                { value: 'under_5', label: 'Under 5', weight: 15 },
                { value: '5_15', label: '5-15', weight: 40 },
                { value: '15_30', label: '15-30', weight: 65 },
                { value: '30_plus', label: '30+', weight: 100 },
              ], domain: 'scale' },
            { key: 'listing_types', type: 'multi_select', label: 'Types of properties you handle?',
              options: [
                { value: 'single_family', label: 'Single Family', weight: 10 },
                { value: 'condo', label: 'Condos/Townhomes', weight: 10 },
                { value: 'luxury_estate', label: 'Luxury Estates', weight: 30 },
                { value: 'commercial_re', label: 'Commercial', weight: 20 },
                { value: 'land', label: 'Land/Lots', weight: 15 },
                { value: 'international', label: 'International', weight: 35 },
              ], domain: 'breadth' },
            { key: 'listing_presentation', type: 'select', label: 'How do you present listings?',
              options: [
                { value: 'basic', label: 'Basic MLS photos', weight: 0 },
                { value: 'professional', label: 'Professional photography', weight: 30 },
                { value: 'media', label: 'Photo + video + virtual tour', weight: 60 },
                { value: 'premium', label: 'Full media + staging + 3D', weight: 85 },
                { value: 'cinematic', label: 'Cinematic production', weight: 100 },
              ], domain: 'marketing_sophistication' },
          ]},
        {
          key: 'lead_generation', title: 'Lead Generation', order: 3,
          description: 'How you generate and qualify leads.',
          questions: [
            { key: 'lead_sources', type: 'multi_select', label: 'Primary lead sources?',
              options: [
                { value: 'zillow', label: 'Zillow/Realtor.com', weight: 15 },
                { value: 'referral', label: 'Referrals', weight: 30 },
                { value: 'social', label: 'Social Media', weight: 25 },
                { value: 'sphere', label: 'Sphere of Influence', weight: 20 },
                { value: 'events', label: 'Events/Open Houses', weight: 15 },
                { value: 'paid_ads', label: 'Paid Advertising', weight: 20 },
                { value: 'crm', label: 'CRM/Email Campaigns', weight: 25 },
              ], domain: 'marketing_sophistication' },
            { key: 'lead_response', type: 'select', label: 'Lead response time?',
              options: [
                { value: 'hours', label: 'Hours', weight: 10 },
                { value: 'within_30', label: 'Within 30 minutes', weight: 40 },
                { value: 'within_5', label: 'Within 5 minutes', weight: 70 },
                { value: 'instant', label: 'Instant/automated response', weight: 100 },
              ], domain: 'client_experience' },
            { key: 'lead_scoring', type: 'boolean', label: 'Do you use lead scoring?',
              weight: 25, domain: 'sophistication' },
            { key: 'nurture_sequences', type: 'boolean', label: 'Do you use automated nurture sequences?',
              weight: 25, domain: 'tech_adoption' },
          ]},
        {
          key: 'client_management', title: 'Client Management', order: 4,
          description: 'How you manage client relationships.',
          questions: [
            { key: 'crm_realestate', type: 'select', label: 'Do you use a real estate CRM?',
              options: [
                { value: 'none', label: 'No CRM', weight: 0 },
                { value: 'basic', label: 'Basic contact management', weight: 20 },
                { value: 'real_estate_crm', label: 'Real estate CRM (e.g., Follow Up Boss)', weight: 55 },
                { value: 'advanced_crm', label: 'Advanced CRM with automation', weight: 80 },
                { value: 'ai_crm_re', label: 'AI-powered CRM with predictions', weight: 100 },
              ], domain: 'tech_adoption' },
            { key: 'client_communication', type: 'select', label: 'Primary client communication method?',
              options: [
                { value: 'phone', label: 'Phone calls', weight: 15 },
                { value: 'email', label: 'Email', weight: 30 },
                { value: 'text', label: 'Text/SMS', weight: 50 },
                { value: 'portal', label: 'Client portal/app', weight: 70 },
                { value: 'omnichannel', label: 'Omnichannel + AI', weight: 100 },
              ], domain: 'client_experience' },
            { key: 'past_client_engagement', type: 'select', label: 'How do you stay in touch with past clients?',
              options: [
                { value: 'none', label: 'Do not follow up', weight: 0 },
                { value: 'occasional', label: 'Occasional check-ins', weight: 20 },
                { value: 'calendar', label: 'Scheduled touchpoints', weight: 50 },
                { value: 'automated', label: 'Automated drip campaigns', weight: 75 },
                { value: 'ai_powered', label: 'AI-powered personalized engagement', weight: 100 },
              ], domain: 'client_experience' },
            { key: 'referral_program', type: 'boolean', label: 'Do you have a formal referral program?',
              weight: 20, domain: 'revenue_quality' },
          ]},
        {
          key: 'marketing_brand', title: 'Marketing & Brand', order: 5,
          description: 'Your brand presence and marketing strategy.',
          questions: [
            { key: 'personal_brand', type: 'select', label: 'Personal branding level?',
              options: [
                { value: 'none', label: 'No personal brand', weight: 0 },
                { value: 'basic_brand', label: 'Basic LinkedIn/IG', weight: 20 },
                { value: 'consistent', label: 'Consistent content creation', weight: 50 },
                { value: 'established', label: 'Established market authority', weight: 75 },
                { value: 'celebrity', label: 'Celebrity agent brand', weight: 100 },
              ], domain: 'marketing_sophistication' },
            { key: 'content_type', type: 'multi_select', label: 'What type of content do you create?',
              options: [
                { value: 'listings', label: 'Listing showcases', weight: 15 },
                { value: 'market_reports', label: 'Market reports', weight: 20 },
                { value: 'educational', label: 'Educational content', weight: 25 },
                { value: 'neighborhood', label: 'Neighborhood guides', weight: 20 },
                { value: 'video', label: 'Video/Reels', weight: 30 },
                { value: 'podcast', label: 'Podcast', weight: 35 },
              ], domain: 'marketing_sophistication' },
            { key: 'website_quality', type: 'select', label: 'Your website?',
              options: [
                { value: 'none_ws', label: 'No website', weight: 0 },
                { value: 'basic_ws', label: 'Basic IDX website', weight: 20 },
                { value: 'custom_ws', label: 'Custom branded website', weight: 55 },
                { value: 'premium_ws', label: 'Premium with lead capture', weight: 80 },
                { value: 'platform_ws', label: 'Full platform with AI tools', weight: 100 },
              ], domain: 'tech_adoption' },
          ]},
        {
          key: 'transactions', title: 'Transactions & Operations', order: 6,
          description: 'Your transaction management process.',
          questions: [
            { key: 'transaction_management', type: 'select', label: 'Transaction management system?',
              options: [
                { value: 'paper', label: 'Paper-based', weight: 0 },
                { value: 'email_tx', label: 'Email/digital documents', weight: 25 },
                { value: 'tx_software', label: 'Transaction management software', weight: 60 },
                { value: 'automated_tx', label: 'Automated with e-sign + tracking', weight: 100 },
              ], domain: 'tech_adoption' },
            { key: 'vendor_network', type: 'boolean', label: 'Do you have a curated vendor network?',
              weight: 15, domain: 'maturity' },
            { key: 'client_reviews', type: 'boolean', label: 'Do you systematically collect client reviews?',
              weight: 20, domain: 'marketing_sophistication' },
          ]},
        {
          key: 'technology_realestate', title: 'Technology Stack', order: 7,
          description: 'The tools powering your real estate business.',
          questions: [
            { key: 'tech_stack_re', type: 'multi_select', label: 'Which tools do you use?',
              options: [
                { value: 'mls', label: 'MLS', weight: 10 },
                { value: 'crm_tool', label: 'CRM (Follow Up Boss, etc.)', weight: 20 },
                { value: 'website_tool', label: 'Website/IDX', weight: 15 },
                { value: 'email_tool', label: 'Email Marketing', weight: 15 },
                { value: 'social_tool', label: 'Social Media Management', weight: 15 },
                { value: 'video_tool', label: 'Video/Creation Tools', weight: 20 },
                { value: 'analytics_tool', label: 'Analytics/BI', weight: 25 },
              ], domain: 'tech_adoption' },
            { key: 'automation_usage', type: 'select', label: 'Level of automation in your business?',
              options: [
                { value: 'manual_all', label: 'Mostly manual', weight: 0 },
                { value: 'some_auto', label: 'Some automation', weight: 30 },
                { value: 'mostly_auto', label: 'Mostly automated', weight: 65 },
                { value: 'fully_auto', label: 'Fully automated workflows', weight: 100 },
              ], domain: 'tech_adoption' },
            { key: 'data_driven', type: 'select', label: 'How data-driven are your decisions?',
              options: [
                { value: 'intuition', label: 'Intuition-based', weight: 10 },
                { value: 'basic_data', label: 'Basic market data', weight: 30 },
                { value: 'analytics', label: 'Regular analytics review', weight: 60 },
                { value: 'predictive_re', label: 'Predictive + prescriptive', weight: 100 },
              ], domain: 'sophistication' },
          ]},
        {
          key: 'team_growth_realestate', title: 'Team & Growth', order: 8,
          description: 'Your team structure and growth plans.',
          questions: [
            { key: 'team_structure', type: 'select', label: 'Team structure?',
              options: [
                { value: 'solo_re', label: 'Solo agent', weight: 15 },
                { value: 'isa', label: 'Agent + ISA', weight: 35 },
                { value: 'full_team', label: 'Full team (agents + staff)', weight: 65 },
                { value: 'multi_office', label: 'Multi-office brokerage', weight: 100 },
              ], domain: 'scale' },
            { key: 'growth_plan', type: 'select', label: 'Growth plan for next year?',
              options: [
                { value: 'maintain_re', label: 'Maintain current volume', weight: 15 },
                { value: 'grow_25', label: 'Grow 10-25%', weight: 40 },
                { value: 'grow_50', label: 'Grow 25-50%', weight: 60 },
                { value: 'double', label: 'Double volume', weight: 80 },
                { value: 'expand_re', label: 'Expand to new markets', weight: 100 },
              ], domain: 'ambition' },
            { key: 'biggest_challenge_re', type: 'select', label: 'Biggest challenge?',
              options: [
                { value: 'leads', label: 'Getting consistent leads', domain: 'challenge' },
                { value: 'conversion', label: 'Lead conversion', domain: 'challenge' },
                { value: 'time', label: 'Time management/admin', domain: 'challenge' },
                { value: 'brand', label: 'Brand visibility', domain: 'challenge' },
                { value: 'tech_re', label: 'Technology adoption', domain: 'challenge' },
              ]},
          ]},
        {
          key: 'ai_readiness_realestate', title: 'AI Readiness', order: 9,
          description: 'Your readiness for AI-powered real estate intelligence.',
          questions: [
            { key: 'ai_familiarity_re', type: 'select', label: 'AI familiarity?',
              options: [
                { value: 'none_re', label: 'Not familiar', weight: 0 },
                { value: 'aware_re', label: 'Aware but not using', weight: 20 },
                { value: 'trying_re', label: 'Trying AI tools', weight: 45 },
                { value: 'using_re', label: 'Regularly using AI', weight: 70 },
                { value: 'advanced_re', label: 'Advanced AI integration', weight: 100 },
              ], domain: 'ai_readiness' },
            { key: 'ai_interest_re', type: 'multi_select', label: 'AI applications that interest you?',
              options: [
                { value: 'lead_gen_ai', label: 'AI Lead Generation', weight: 25 },
                { value: 'chatbots', label: 'AI Chatbots/Conversation', weight: 20 },
                { value: 'valuation', label: 'AI Valuation/CMA', weight: 20 },
                { value: 'marketing_ai_re', label: 'AI Content/Marketing', weight: 25 },
                { value: 'predictive_re', label: 'AI Predictive Analytics', weight: 30 },
                { value: 'automation_re', label: 'Workflow Automation', weight: 20 },
              ], domain: 'ai_readiness' },
            { key: 'data_readiness', type: 'select', label: 'Quality of your client data?',
              options: [
                { value: 'poor_re', label: 'Poor/unorganized', weight: 0 },
                { value: 'fair_re', label: 'Fair — some structure', weight: 25 },
                { value: 'good_re', label: 'Good — mostly clean', weight: 55 },
                { value: 'excellent_re', label: 'Excellent — enriched', weight: 100 },
              ], domain: 'ai_readiness' },
          ]},
      ],
      scoring: {
        domains: [
          { key: 'maturity', name: 'Business Maturity', weight: 10,
            thresholds: [
              { min: 0, label: 'New Agent', agents: ['lead_sales'], swarms: ['sales_realestate_swarm'] },
              { min: 35, label: 'Established', agents: ['lead_sales', 'concierge_booking'], swarms: ['sales_realestate_swarm', 'service_concierge_swarm'] },
              { min: 70, label: 'Veteran', agents: ['lead_sales', 'concierge_booking', 'enterprise_infrastructure'], swarms: ['sales_realestate_swarm', 'service_concierge_swarm', 'executive_ops_swarm'] },
            ]},
          { key: 'scale', name: 'Business Scale', weight: 10,
            thresholds: [
              { min: 0, label: 'Solo', agents: ['lead_sales'], swarms: ['sales_realestate_swarm'] },
              { min: 50, label: 'Team', agents: ['lead_sales', 'concierge_booking', 'enterprise_infrastructure'], swarms: ['sales_realestate_swarm', 'service_concierge_swarm', 'ops_internal_swarm'] },
            ]},
          { key: 'revenue_quality', name: 'Revenue Quality', weight: 15,
            thresholds: [
              { min: 0, label: 'Entry', agents: ['lead_sales'], swarms: ['sales_realestate_swarm'] },
              { min: 50, label: 'Premium', agents: ['lead_sales', 'concierge_booking'], swarms: ['sales_realestate_swarm', 'financial_cfo_swarm'] },
            ]},
          { key: 'marketing_sophistication', name: 'Marketing Sophistication', weight: 20,
            thresholds: [
              { min: 0, label: 'Basic', agents: ['lead_sales'], swarms: ['sales_realestate_swarm'] },
              { min: 40, label: 'Growing', agents: ['lead_sales', 'creator_commerce'], swarms: ['sales_realestate_swarm', 'creator_growth_swarm'] },
              { min: 70, label: 'Advanced', agents: ['lead_sales', 'creator_commerce', 'forecasting_agent'], swarms: ['sales_realestate_swarm', 'creator_growth_swarm', 'research_intelligence_swarm'] },
            ]},
          { key: 'client_experience', name: 'Client Experience', weight: 15,
            thresholds: [
              { min: 0, label: 'Transactional', agents: ['lead_sales'], swarms: ['sales_realestate_swarm'] },
              { min: 50, label: 'Relationship', agents: ['lead_sales', 'concierge_booking', 'intake_consultation'], swarms: ['sales_realestate_swarm', 'service_concierge_swarm'] },
            ]},
          { key: 'tech_adoption', name: 'Technology Adoption', weight: 15,
            thresholds: [
              { min: 0, label: 'Low Tech', agents: ['lead_sales'], swarms: ['sales_realestate_swarm'] },
              { min: 40, label: 'Moderate Tech', agents: ['lead_sales', 'integration_agent'], swarms: ['sales_realestate_swarm', 'ops_internal_swarm'] },
              { min: 70, label: 'High Tech', agents: ['lead_sales', 'intelligence_agent', 'integration_agent', 'forecasting_agent'], swarms: ['sales_realestate_swarm', 'ops_internal_swarm', 'research_intelligence_swarm'] },
            ]},
          { key: 'ai_readiness', name: 'AI Readiness', weight: 10,
            thresholds: [
              { min: 0, label: 'AI Curious', agents: ['lead_sales'], swarms: ['sales_realestate_swarm'] },
              { min: 45, label: 'AI Ready', agents: ['lead_sales', 'intelligence_agent'], swarms: ['sales_realestate_swarm', 'research_intelligence_swarm'] },
            ]},
        ],
      },
      recommendations: {
        agents: ['lead_sales', 'concierge_booking', 'intelligence_agent', 'forecasting_agent'],
        swarms: ['sales_realestate_swarm', 'creator_growth_swarm', 'financial_cfo_swarm'],
        essenceTemplate: 'luxury_client_essence',
        risTemplate: 'luxury_ris',
      },
    },
  },
};


// ═══════════════════════════════════════════════════════════════
// Execute Seed
// ═══════════════════════════════════════════════════════════════

async function seed() {
  const client = await pool.connect();
  
  try {
    for (const [key, data] of Object.entries(BLUEPRINTS)) {
      const { vertical_key, subcategory_key, name, description, sections_json, template_json } = data;
      
      const result = await client.query(`
        UPDATE blueprint_templates
        SET name = $1,
            description = $2,
            sections_json = $3::jsonb,
            template_json = $4::jsonb,
            is_active = true,
            updated_at = now()
        WHERE key = $5
        RETURNING id, key, name
      `, [name, description, JSON.stringify(sections_json), JSON.stringify(template_json), key]);
      
      if (result.rows.length > 0) {
        console.log(`✅ Updated: ${result.rows[0].key} — "${name}"`);
      } else {
        console.log(`❌ Not found: ${key}`);
      }
    }

    // Also populate essences and RIS with basic content
    await client.query(`
      UPDATE essence_templates
      SET name = CASE key
            WHEN 'luxury_client_essence' THEN 'Luxury Client Daily Essence'
            WHEN 'wellness_client_essence' THEN 'Wellness Client Daily Essence'
            ELSE name
          END,
          description = CASE key
            WHEN 'luxury_client_essence' THEN 'Daily intelligence briefing for luxury hospitality and concierge clients'
            WHEN 'wellness_client_essence' THEN 'Daily intelligence briefing for wellness and med spa clients'
            ELSE description
          END,
          sections_json = '[{"key":"daily_insights","order":1},{"key":"predictions","order":2},{"key":"rituals","order":3},{"key":"optimizations","order":4}]'::jsonb,
          template_json = '{"version":"1.0","sections":[{"key":"daily_insights","title":"Daily Insights","order":1,"questions":[{"key":"top_opportunity","type":"text","label":"Top client opportunity today"},{"key":"risk_flag","type":"text","label":"Any risk flags"}]},{"key":"predictions","title":"Predictions","order":2,"questions":[]},{"key":"rituals","title":"Daily Rituals","order":3,"questions":[]},{"key":"optimizations","title":"Optimizations","order":4,"questions":[]}],"essence_type":"daily"}',
          updated_at = now()
      `);
    console.log('✅ Updated essence_templates');
    
    await client.query(`
      UPDATE ris_templates
      SET name = CASE key
            WHEN 'luxury_ris' THEN 'Luxury Resonance Intelligence System'
            WHEN 'beauty_ris' THEN 'Beauty Industry RIS'
            ELSE name
          END,
          description = CASE key
            WHEN 'luxury_ris' THEN 'Resonance intelligence signals for luxury services'
            WHEN 'beauty_ris' THEN 'Resonance intelligence signals for beauty and wellness'
            ELSE description
          END,
          signal_weights_json = '{"purchase_intent":0.3,"satisfaction":0.2,"engagement":0.25,"churn_risk":0.15,"lifetime_value":0.1}'::jsonb,
          updated_at = now()
      `);
    console.log('✅ Updated ris_templates');

    console.log('\n🎉 Blueprint seeding complete!');
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
