require('dotenv').config({ path: '.env.local' });
const pg = require('pg');
const url = 'postgresql://postgres:' + encodeURIComponent(process.env.SUPABASE_DB_PASSWORD) + '@db.jebixydqpvsegvrtfmgm.supabase.co:5432/postgres';
const pool = new pg.Pool({ connectionString: url, connectionTimeoutMillis: 10000 });

// Workflows matching each vertical from components/demo/vertical-data.ts
const WORKFLOWS = [
  // ── REAL ESTATE (5 agents → 5 workflows + 1 swarm) ──
  { vertical: 'real_estate_land', name: 'Lead Nurture & Qualification', category: 'intake',
    desc: 'Automatically follow up with leads, qualify interest, schedule showings, and keep your pipeline warm 24/7.',
    tags: ['real_estate', 'leads', 'nurture', 'qualification'],
    stages: [{key:'lead_capture',order:1,title:'Lead Capture',required:true},{key:'qualification',order:2,title:'Qualification & Scoring',required:true},{key:'showing_scheduling',order:3,title:'Showing Scheduling',required:true},{key:'follow_up',order:4,title:'Follow-Up Automation',required:false}] },
  { vertical: 'real_estate_land', name: 'Property Match Intelligence', category: 'assessment',
    desc: 'Pair buyers with their ideal properties using preference analysis and market data.',
    tags: ['real_estate', 'property_match', 'preferences'],
    stages: [{key:'buyer_preferences',order:1,title:'Buyer Preferences',required:true},{key:'market_scan',order:2,title:'Market Scan',required:true},{key:'property_shortlist',order:3,title:'Property Shortlist',required:true},{key:'comparative_analysis',order:4,title:'Comparative Analysis',required:false}] },
  { vertical: 'real_estate_land', name: 'Market Intelligence Monitoring', category: 'automation',
    desc: 'Track neighborhood trends, pricing shifts, days-on-market, and emerging opportunities in real-time.',
    tags: ['real_estate', 'market_intel', 'trends'],
    stages: [{key:'neighborhood_tracking',order:1,title:'Neighborhood Tracking',required:true},{key:'pricing_analysis',order:2,title:'Pricing Analysis',required:true},{key:'opportunity_detection',order:3,title:'Opportunity Detection',required:true},{key:'weekly_briefing',order:4,title:'Weekly Briefing',required:false}] },
  { vertical: 'real_estate_land', name: 'Transaction Coordination', category: 'automation',
    desc: 'Handle paperwork, deadlines, escrow coordination, and compliance so no deal falls through.',
    tags: ['real_estate', 'transactions', 'compliance'],
    stages: [{key:'document_collection',order:1,title:'Document Collection',required:true},{key:'deadline_tracking',order:2,title:'Deadline Tracking',required:true},{key:'escrow_coordination',order:3,title:'Escrow Coordination',required:true},{key:'compliance_check',order:4,title:'Compliance Check',required:true}] },
  { vertical: 'real_estate_land', name: 'Client Relations & Referrals', category: 'service',
    desc: 'Manage client communication, referrals, reviews, and long-touch nurture campaigns.',
    tags: ['real_estate', 'client_relations', 'referrals'],
    stages: [{key:'communication',order:1,title:'Communication Automation',required:true},{key:'review_management',order:2,title:'Review Management',required:true},{key:'referral_generation',order:3,title:'Referral Generation',required:true},{key:'long_term_nurture',order:4,title:'Long-Term Nurture',required:false}] },
  { vertical: 'real_estate_land', name: 'Client Acquisition Swarm', category: 'swarm',
    desc: 'Five agents collaborating to manage your entire real estate pipeline — from first lead to closed deal.',
    tags: ['real_estate', 'swarm', 'pipeline'],
    stages: [{key:'lead_nurture',order:1,title:'Lead Nurture Agent',required:true},{key:'property_match',order:2,title:'Property Match Intelligence',required:true},{key:'market_intel',order:3,title:'Market Intelligence Engine',required:true},{key:'transaction_coordinator',order:4,title:'Transaction Coordinator',required:true},{key:'client_relations',order:5,title:'Client Relations Agent',required:true}] },

  // ── HOSPITALITY ──
  { vertical: 'luxury_hospitality', name: 'Guest Check-In & Preferences', category: 'intake',
    desc: 'Personalize every guest interaction from pre-arrival to post-stay. Learn guest preferences across visits.',
    tags: ['hospitality', 'guest', 'checkin'],
    stages: [{key:'reservation_lookup',order:1,title:'Reservation Lookup',required:true},{key:'preference_collection',order:2,title:'Preference Collection',required:true},{key:'room_assignment',order:3,title:'Room Assignment',required:true},{key:'welcome_prep',order:4,title:'Welcome Preparation',required:false}] },
  { vertical: 'luxury_hospitality', name: 'Concierge Request Handling', category: 'service',
    desc: 'Handle every guest request — dining, spa bookings, room service, local experiences — in natural conversation.',
    tags: ['hospitality', 'concierge', 'requests'],
    stages: [{key:'request_intake',order:1,title:'Request Intake',required:true},{key:'availability_check',order:2,title:'Availability Check',required:true},{key:'booking_confirmation',order:3,title:'Booking Confirmation',required:true},{key:'guest_follow_up',order:4,title:'Guest Follow-Up',required:false}] },
  { vertical: 'luxury_hospitality', name: 'Revenue Optimization', category: 'automation',
    desc: 'Dynamic pricing based on demand, seasonality, events, and booking patterns in real-time.',
    tags: ['hospitality', 'revenue', 'pricing'],
    stages: [{key:'demand_analysis',order:1,title:'Demand Analysis',required:true},{key:'rate_adjustment',order:2,title:'Rate Adjustment',required:true},{key:'package_optimization',order:3,title:'Package Optimization',required:true},{key:'forecast_report',order:4,title:'Forecast Report',required:false}] },
  { vertical: 'luxury_hospitality', name: 'Operations Sentinel', category: 'automation',
    desc: 'Monitor housekeeping, maintenance, F&B, and front desk. Flag issues before guests notice.',
    tags: ['hospitality', 'operations', 'monitoring'],
    stages: [{key:'housekeeping',order:1,title:'Housekeeping Coordination',required:true},{key:'maintenance_alerts',order:2,title:'Maintenance Alerts',required:true},{key:'fnb_tracking',order:3,title:'F&B Inventory Tracking',required:true},{key:'front_desk_oversight',order:4,title:'Front Desk Oversight',required:true}] },
  { vertical: 'luxury_hospitality', name: 'Guest Insights & Sentiment', category: 'assessment',
    desc: 'Aggregate guest feedback, reviews, and behavior data to surface actionable insights.',
    tags: ['hospitality', 'insights', 'sentiment'],
    stages: [{key:'feedback_collection',order:1,title:'Feedback Collection',required:true},{key:'sentiment_analysis',order:2,title:'Sentiment Analysis',required:true},{key:'review_aggregation',order:3,title:'Review Aggregation',required:true},{key:'service_improvement',order:4,title:'Service Improvement Recommendations',required:false}] },
  { vertical: 'luxury_hospitality', name: 'Hotel Operations Swarm', category: 'swarm',
    desc: 'Five agents working 24/7 to deliver luxury hospitality — guest experience, concierge, revenue, operations, insights.',
    tags: ['hospitality', 'swarm', 'operations'],
    stages: [{key:'guest_experience',order:1,title:'Guest Experience AI',required:true},{key:'concierge',order:2,title:'Concierge Intelligence',required:true},{key:'revenue',order:3,title:'Revenue Optimizer',required:true},{key:'operations',order:4,title:'Operations Sentinel',required:true},{key:'insights',order:5,title:'Guest Insights Engine',required:true}] },

  // ── MED SPA ──
  { vertical: 'health_wellness_longevity', name: 'Client Concierge & Booking', category: 'intake',
    desc: 'Handle bookings, rescheduling, cancellations, and automated follow-ups with calendar sync.',
    tags: ['med_spa', 'booking', 'concierge'],
    stages: [{key:'booking_request',order:1,title:'Booking Request',required:true},{key:'availability',order:2,title:'Availability Check',required:true},{key:'confirmation',order:3,title:'Confirmation & Reminders',required:true},{key:'follow_up',order:4,title:'Post-Visit Follow-Up',required:false}] },
  { vertical: 'health_wellness_longevity', name: 'Treatment Intelligence', category: 'assessment',
    desc: 'Analyze client history and preferences to recommend the right treatments and products.',
    tags: ['med_spa', 'treatment', 'recommendations'],
    stages: [{key:'client_history',order:1,title:'Client History Review',required:true},{key:'treatment_matching',order:2,title:'Treatment Matching',required:true},{key:'cross_sell',order:3,title:'Cross-Sell Optimization',required:true},{key:'product_recommendation',order:4,title:'Product Recommendations',required:false}] },
  { vertical: 'health_wellness_longevity', name: 'Retention Monitoring', category: 'automation',
    desc: 'Monitor engagement patterns, flag at-risk clients, and trigger re-engagement campaigns.',
    tags: ['med_spa', 'retention', 'churn'],
    stages: [{key:'engagement_tracking',order:1,title:'Engagement Tracking',required:true},{key:'churn_detection',order:2,title:'Churn Detection',required:true},{key:'re_engagement',order:3,title:'Re-Engagement Campaign',required:true},{key:'loyalty_mgmt',order:4,title:'Loyalty Program Management',required:false}] },
  { vertical: 'health_wellness_longevity', name: 'Marketing Intelligence', category: 'automation',
    desc: 'Optimize ad spend, track ROI, and generate campaign recommendations from real-time client data.',
    tags: ['med_spa', 'marketing', 'campaigns'],
    stages: [{key:'campaign_analysis',order:1,title:'Campaign Analysis',required:true},{key:'roi_tracking',order:2,title:'ROI Tracking',required:true},{key:'audience_segmentation',order:3,title:'Audience Segmentation',required:true},{key:'content_generation',order:4,title:'Content Generation',required:false}] },
  { vertical: 'health_wellness_longevity', name: 'Operations Orchestration', category: 'automation',
    desc: 'Coordinate staff schedules, inventory, supply orders, and daily workflows.',
    tags: ['med_spa', 'operations', 'scheduling'],
    stages: [{key:'staff_scheduling',order:1,title:'Staff Scheduling',required:true},{key:'inventory_check',order:2,title:'Inventory Check',required:true},{key:'supply_ordering',order:3,title:'Supply Ordering',required:true},{key:'daily_ops',order:4,title:'Daily Ops Dashboard',required:false}] },
  { vertical: 'health_wellness_longevity', name: 'Med Spa Operations Swarm', category: 'swarm',
    desc: 'Five agents collaborating to run your entire practice — booking, treatment, retention, marketing, operations.',
    tags: ['med_spa', 'swarm', 'operations'],
    stages: [{key:'concierge',order:1,title:'Client Concierge',required:true},{key:'treatment_intel',order:2,title:'Treatment Intelligence Engine',required:true},{key:'retention',order:3,title:'Retention Sentinel',required:true},{key:'marketing_intel',order:4,title:'Marketing Intelligence Agent',required:true},{key:'ops_orchestrator',order:5,title:'Operations Orchestrator',required:true}] },

  // ── HR ──
  { vertical: 'human_development_performance', name: 'Talent Acquisition Pipeline', category: 'intake',
    desc: 'Screen candidates, schedule interviews, rank applicants, and manage the entire hiring pipeline.',
    tags: ['hr', 'talent', 'hiring'],
    stages: [{key:'candidate_screening',order:1,title:'Candidate Screening',required:true},{key:'interview_scheduling',order:2,title:'Interview Scheduling',required:true},{key:'applicant_ranking',order:3,title:'Applicant Ranking',required:true},{key:'pipeline_management',order:4,title:'Pipeline Management',required:true}] },
  { vertical: 'human_development_performance', name: 'Employee Onboarding', category: 'automation',
    desc: 'Handle paperwork, equipment setup, training plans, and compliance for every new hire.',
    tags: ['hr', 'onboarding', 'compliance'],
    stages: [{key:'paperwork',order:1,title:'Paperwork Automation',required:true},{key:'equipment',order:2,title:'Equipment Provisioning',required:true},{key:'training_plan',order:3,title:'Training Plan Generation',required:true},{key:'compliance_tracking',order:4,title:'Compliance Tracking',required:true}] },
  { vertical: 'human_development_performance', name: 'Employee Intelligence', category: 'assessment',
    desc: 'Track engagement, performance, satisfaction, and growth patterns to reduce turnover.',
    tags: ['hr', 'engagement', 'analytics'],
    stages: [{key:'engagement_tracking',order:1,title:'Engagement Tracking',required:true},{key:'performance_analytics',order:2,title:'Performance Analytics',required:true},{key:'satisfaction_monitoring',order:3,title:'Satisfaction Monitoring',required:true},{key:'growth_mapping',order:4,title:'Growth Path Mapping',required:false}] },
  { vertical: 'human_development_performance', name: 'Compliance Management', category: 'automation',
    desc: 'Monitor regulatory requirements, certification expirations, and generate compliance reports.',
    tags: ['hr', 'compliance', 'audit'],
    stages: [{key:'regulatory_monitoring',order:1,title:'Regulatory Monitoring',required:true},{key:'certification_tracking',order:2,title:'Certification Tracking',required:true},{key:'policy_management',order:3,title:'Policy Management',required:true},{key:'audit_reporting',order:4,title:'Audit Reporting',required:true}] },
  { vertical: 'human_development_performance', name: 'Workforce Planning', category: 'assessment',
    desc: 'Analyze headcount needs, skill gaps, and staffing forecasts for strategic decisions.',
    tags: ['hr', 'workforce', 'planning'],
    stages: [{key:'headcount_analysis',order:1,title:'Headcount Analysis',required:true},{key:'skill_gap_mapping',order:2,title:'Skill Gap Mapping',required:true},{key:'staffing_forecast',order:3,title:'Staffing Forecast',required:true},{key:'org_planning',order:4,title:'Organizational Planning',required:false}] },
  { vertical: 'human_development_performance', name: 'Workforce Intelligence Swarm', category: 'swarm',
    desc: 'Five agents powering people operations — talent acquisition, onboarding, engagement, compliance, planning.',
    tags: ['hr', 'swarm', 'workforce'],
    stages: [{key:'talent_acquisition',order:1,title:'Talent Acquisition Agent',required:true},{key:'onboarding',order:2,title:'Onboarding Automator',required:true},{key:'employee_intel',order:3,title:'Employee Intelligence Engine',required:true},{key:'compliance',order:4,title:'Compliance Sentinel',required:true},{key:'workforce_planner',order:5,title:'Workforce Planner',required:true}] },

  // ── LEGAL ──
  { vertical: 'law_governance_policy', name: 'Client Intake & Qualification', category: 'intake',
    desc: 'Screen potential clients, qualify cases, check conflicts, and schedule consultations.',
    tags: ['legal', 'intake', 'qualification'],
    stages: [{key:'case_screening',order:1,title:'Case Screening',required:true},{key:'conflict_check',order:2,title:'Conflict Check',required:true},{key:'consultation_scheduling',order:3,title:'Consultation Scheduling',required:true},{key:'initial_data',order:4,title:'Initial Data Collection',required:false}] },
  { vertical: 'law_governance_policy', name: 'Document Intelligence', category: 'automation',
    desc: 'Draft standard documents, review contracts for risk, and organize filings.',
    tags: ['legal', 'documents', 'drafting'],
    stages: [{key:'document_drafting',order:1,title:'Document Drafting',required:true},{key:'contract_review',order:2,title:'Contract Review',required:true},{key:'filing_organization',order:3,title:'Filing Organization',required:true},{key:'knowledge_mgmt',order:4,title:'Knowledge Management',required:false}] },
  { vertical: 'law_governance_policy', name: 'Case Management', category: 'automation',
    desc: 'Track court dates, filing deadlines, task assignments, and case milestones across every matter.',
    tags: ['legal', 'case_management', 'deadlines'],
    stages: [{key:'deadline_tracking',order:1,title:'Deadline Tracking',required:true},{key:'task_coordination',order:2,title:'Task Coordination',required:true},{key:'milestone_monitoring',order:3,title:'Milestone Monitoring',required:true},{key:'calendar_mgmt',order:4,title:'Calendar Management',required:true}] },
  { vertical: 'law_governance_policy', name: 'Billing Automation', category: 'automation',
    desc: 'Track billable hours, generate invoices, manage trust accounts, and follow up on payments.',
    tags: ['legal', 'billing', 'invoicing'],
    stages: [{key:'time_tracking',order:1,title:'Time Tracking',required:true},{key:'invoice_generation',order:2,title:'Invoice Generation',required:true},{key:'trust_accounting',order:3,title:'Trust Accounting',required:true},{key:'payment_followup',order:4,title:'Payment Follow-Up',required:false}] },
  { vertical: 'law_governance_policy', name: 'Legal Research', category: 'assessment',
    desc: 'Search case law, statutes, and legal databases. Surface relevant precedents and summarize findings.',
    tags: ['legal', 'research', 'precedent'],
    stages: [{key:'research_query',order:1,title:'Research Query',required:true},{key:'case_law_search',order:2,title:'Case Law Search',required:true},{key:'precedent_analysis',order:3,title:'Precedent Analysis',required:true},{key:'case_summarization',order:4,title:'Case Summarization',required:false}] },
  { vertical: 'law_governance_policy', name: 'Legal Practice Operations Swarm', category: 'swarm',
    desc: 'Five agents running your firm — intake, documents, cases, billing, research — so you focus on practicing law.',
    tags: ['legal', 'swarm', 'operations'],
    stages: [{key:'intake',order:1,title:'Client Intake Agent',required:true},{key:'documents',order:2,title:'Document Intelligence Engine',required:true},{key:'cases',order:3,title:'Case Management Coordinator',required:true},{key:'billing',order:4,title:'Billing Automation Agent',required:true},{key:'research',order:5,title:'Research Associate',required:true}] },
];

async function main() {
  console.log('Connected');

  // Clear and reseed
  await pool.query('DELETE FROM workflow_demos');
  console.log('Cleared existing workflows');

  let count = 0;
  for (const wf of WORKFLOWS) {
    await pool.query(`
      INSERT INTO workflow_demos (vertical, name, description, stages, category, tags, is_active, run_status)
      VALUES ($1, $2, $3, $4, $5, $6, true, 'draft')
    `, [wf.vertical, wf.name, wf.desc, JSON.stringify(wf.stages), wf.category, wf.tags]);
    count++;
  }

  console.log('Inserted ' + count + ' demo workflows');

  // Show summary
  const { rows } = await pool.query(
    "SELECT vertical, COUNT(*)::int AS cnt FROM workflow_demos GROUP BY vertical ORDER BY cnt DESC"
  );
  console.log('\nBy vertical:');
  for (const r of rows) console.log('  ' + r.vertical + ': ' + r.cnt);
  console.log('\nTotal: ' + count);
  pool.end();
}

main().catch(e => { console.log('Error:', e.message); pool.end(); });
