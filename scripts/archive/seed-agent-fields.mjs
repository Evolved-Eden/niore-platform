/**
 * seed-agent-fields.mjs
 * 
 * Populates ALL empty fields across 428 agents:
 * - agent_type, description, tagline, icon
 * - is_platform, is_system_agent, orchestration_mode
 * - avatar_id, vertical_subs, evolution_status, decision_mode
 * - autonomy_level, authority_level, risk_level
 * - specialties (behavior roles + domain specialties)
 * - capabilities, tools, connectors
 * - mas_score, mas_category
 * - metadata (pack info)
 * 
 * Then creates swarms per vertical and assigns agents.
 * Then assigns workflows to agents.
 */

import pg from 'pg';

const pool = new pg.Pool({
  host: process.env.DB_HOST || 'db.jebixydqpvsegvrtfmgm.supabase.co',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'postgres',
  user: process.env.DB_USER || 'postgres',
  password: process.env.SUPABASE_DB_PASSWORD ,
  ssl: { rejectUnauthorized: false },
});

// ============================================================
// 1. MAPPING TABLES
// ============================================================

// Map role_type → agent_type (primary key from agent_types table)
const ROLE_TYPE_AGENT_TYPE = {
  CORE: 'orchestration_agent',
  BRIDGE: 'bridge_agent',
  CRISIS: 'intake_consultation',
  CROSS_SYSTEM: 'intelligence_agent',
  UTILITY: 'batch_compute_agent',
};

// Map vertical → agent_type for VERTICAL agents
const VERTICAL_AGENT_TYPE = {
  real_estate: 'lead_sales',
  hospitality: 'concierge_booking',
  luxury: 'concierge_booking',
  travel: 'concierge_booking',
  health: 'intake_consultation',
  wellness: 'intake_consultation',
  beauty: 'intake_consultation',
  fitness: 'intake_consultation',
  legal: 'lead_sales',
  wealth: 'lead_sales',
  finance: 'lead_sales',
  financial_crisis: 'lead_sales',
  creator: 'creator_commerce',
  commerce: 'creator_commerce',
  media: 'creator_commerce',
  arts: 'creator_commerce',
  education: 'intake_consultation',
  early_childhood: 'intake_consultation',
  youth: 'intake_consultation',
  elder_care: 'intake_consultation',
  social_services: 'intake_consultation',
  immigration: 'intake_consultation',
  veterans: 'intake_consultation',
  addiction: 'intake_consultation',
  mental_health: 'intake_consultation',
  crisis: 'intake_consultation',
  corporate: 'enterprise_infrastructure',
  corporate_extended: 'enterprise_infrastructure',
  tech: 'enterprise_infrastructure',
  ai: 'enterprise_infrastructure',
  infrastructure: 'enterprise_infrastructure',
  government: 'enterprise_infrastructure',
  manufacturing: 'enterprise_infrastructure',
  sustainability: 'enterprise_infrastructure',
  sports: 'lead_sales',
  food: 'lead_sales',
  events: 'lead_sales',
  relationships: 'intake_consultation',
  spiritual: 'intake_consultation',
  legacy: 'enterprise_infrastructure',
  global_impact: 'bridge_agent',
  core: 'orchestration_agent',
};

// Behavior roles (from user's list) → mapped by role_type
const BEHAVIOR_ROLES = {
  CORE: ['Orchestrator', 'Coordinator', 'Planner', 'Monitor', 'Reconciler'],
  VERTICAL: ['Intake', 'Researcher', 'Analyst', 'Synthesizer', 'Classifier'],
  BRIDGE: ['Router', 'Case Manager', 'Archivist', 'Dispatcher'],
  CROSS_SYSTEM: ['Analyst', 'Interpreter', 'Synthesizer', 'Researcher'],
  UTILITY: ['Executor', 'Operator', 'Workflow Runner', 'Task Agent'],
  CRISIS: ['Triage', 'Sentinel', 'Escalation', 'Guardian'],
};

// Domain specialties (from user's list) → mapped by vertical
const DOMAIN_SPECIALTIES = {
  real_estate: ['Property Intake', 'Lead Qualification', 'Market Research', 'Showing Coordination', 'Transaction Coordination', 'Listing Assistant', 'Tenant Screening'],
  hospitality: ['Concierge', 'Booking', 'Guest Experience', 'Front Desk'],
  travel: ['Travel Concierge', 'Booking', 'Itinerary Planning'],
  luxury: ['Concierge', 'VIP Relations', 'Premium Service'],
  health: ['Intake Screening', 'Care Matching', 'Clinician Summary', 'Follow-up Tracking'],
  wellness: ['Wellness Check', 'Support Coach', 'Progress Tracking'],
  beauty: ['Intake Screening', 'Booking', 'Client Relations'],
  legal: ['Matter Intake', 'Document Review', 'Clause Extraction', 'Research', 'Compliance Review', 'Deadline Manager'],
  wealth: ['KYC Intake', 'Portfolio Forecast', 'Client Reporting', 'Risk Assessment'],
  finance: ['Risk Assessment', 'Reconciliation', 'Compliance Review', 'Fraud Monitor'],
  financial_crisis: ['Crisis Triage', 'Scenario Planning', 'Risk Assessment'],
  creator: ['Creator Onboarding', 'Content Planning', 'Audience Growth', 'Revenue Optimization'],
  commerce: ['Offer Architecture', 'Marketplace', 'Inventory', 'Order Management'],
  media: ['Media Production', 'Content Distribution', 'Analytics'],
  arts: ['Arts Curation', 'Exhibition Planning', 'Creative Direction'],
  education: ['Curriculum Planning', 'Lesson Planning', 'Assessment', 'Student Progress'],
  early_childhood: ['Milestone Tracking', 'Parent Guidance', 'Learning Planner', 'Activity Recommender'],
  youth: ['Youth Development', 'Enrichment Planning', 'Progress Reporting'],
  elder_care: ['Care Coordination', 'Wellness Check', 'Guardian Communication'],
  social_services: ['Intake Screening', 'Resource Referral', 'Case Management'],
  immigration: ['Immigration Intake', 'Document Review', 'Case Tracking'],
  veterans: ['Veterans Intake', 'Benefits Coordination', 'Support Services'],
  addiction: ['Addiction Recovery', 'Detox Support', 'Relapse Prevention', '12-Step Support'],
  mental_health: ['Intake Screening', 'Therapy Matching', 'Mood Monitoring', 'Session Support'],
  crisis: ['Crisis Triage', 'Safety Escalation', 'Emergency Routing', 'De-escalation'],
  corporate: ['Executive Support', 'Operations', 'Internal Communications', 'Process Management'],
  corporate_extended: ['M&A Support', 'Due Diligence', 'Integration Planning'],
  tech: ['Product Development', 'Technical Research', 'Architecture Planning'],
  ai: ['AI Workflow', 'Model Selection', 'Integration'],
  infrastructure: ['Infrastructure Planning', 'Systems Integration', 'Deployment'],
  government: ['Civic Services', 'Policy Research', 'Constituent Support'],
  manufacturing: ['Manufacturing Ops', 'Supply Chain', 'Quality Control'],
  sustainability: ['Sustainability Strategy', 'Carbon Tracking', 'Green Compliance'],
  sports: ['Athlete Brand', 'Performance Tracking', 'Sponsorship'],
  food: ['Recipe Development', 'Menu Planning', 'Ingredient Sourcing'],
  events: ['Event Planning', 'Venue Coordination', 'Guest Management'],
  relationships: ['Relationship Coaching', 'Dating Support', 'Communication'],
  spiritual: ['Spiritual Guidance', 'Meditation', 'Personal Growth'],
  legacy: ['Estate Planning', 'Legacy Management', 'Asset Distribution'],
  global_impact: ['Global Impact', 'Bridge Coordination', 'Cross-Vertical'],
  core: ['System Orchestration', 'Governance', 'Blueprint', 'Identity'],
};

// Orchestration modes by role_type
const ORCHESTRATION_MODE = {
  CORE: 'autonomous',
  VERTICAL: 'managed',
  BRIDGE: 'managed',
  CROSS_SYSTEM: 'autonomous',
  UTILITY: 'scheduled',
  CRISIS: 'autonomous',
};

// Decision modes by role_type
const DECISION_MODE = {
  CORE: 'DETERMINISTIC',
  VERTICAL: 'WEIGHTED',
  BRIDGE: 'ADVISORY',
  CROSS_SYSTEM: 'WEIGHTED',
  UTILITY: 'DETERMINISTIC',
  CRISIS: 'DETERMINISTIC',
};

// Autonomy/Authority/Risk by role_type
const AUTONOMY = {
  CORE: { level: 'high', authority: 'high', risk: 'medium' },
  VERTICAL: { level: 'medium', authority: 'medium', risk: 'low' },
  BRIDGE: { level: 'medium', authority: 'medium', risk: 'low' },
  CROSS_SYSTEM: { level: 'high', authority: 'advisory', risk: 'medium' },
  UTILITY: { level: 'low', authority: 'low', risk: 'low' },
  CRISIS: { level: 'high', authority: 'emergency', risk: 'high' },
};

// Icons by role_type (text only, no emoji)
const ICONS = {
  CORE: 'core',
  VERTICAL: 'vertical',
  BRIDGE: 'bridge',
  CROSS_SYSTEM: 'cross_system',
  UTILITY: 'utility',
  CRISIS: 'crisis',
};

// Vertical → sub-vertical mapping (from vertical_subs table)
const VERTICAL_SUB_MAP = {
  beauty: ['spa', 'salon', 'med_spa'],
  fitness: ['gym', 'spa', 'med_spa'],
  real_estate: ['realtor', 'hotel', 'gym', 'spa', 'salon', 'med_spa'],
  hospitality: ['hotel', 'spa', 'salon', 'med_spa'],
};

// Vertical → tools
const VERTICAL_TOOLS = {
  real_estate: 'MLS, DocuSign, CRM, Calendar, Email, Slack',
  hospitality: 'Booking Engine, PMS, CRM, Email, Slack, Calendar',
  health: 'EHR, Calendar, Email, SMS, Video',
  legal: 'Document Management, Calendar, Email, CRM, Research DB',
  wealth: 'Portfolio Tracker, CRM, Email, Document Vault',
  finance: 'QuickBooks, Excel, CRM, Email, Reporting Tool',
  creator: 'Social Media Tools, Analytics, Email, Calendar',
  commerce: 'Shopify, Inventory, Email, Slack, Analytics',
  education: 'LMS, Calendar, Email, Video, Analytics',
  corporate: 'Slack, Email, Calendar, Jira, Notion, CRM',
  core: 'Slack, Email, Calendar, Jira, GitHub, Notion',
  crisis: 'SMS, Phone, Email, CRM, Calendar, Resource DB',
  mental_health: 'EHR, Calendar, Video, SMS, Email',
  social_services: 'Case Management, Calendar, Email, SMS',
  government: 'CRM, Document Management, Email, Calendar',
  tech: 'GitHub, Slack, Jira, Notion, Email, Calendar',
  ai: 'OpenAI API, GitHub, Slack, Email, Vector DB',
  manufacturing: 'ERP, Inventory, Slack, Email, Calendar',
  sustainability: 'Analytics, CRM, Email, Document Management',
  media: 'Content Management, Analytics, Email, Calendar',
  sports: 'CRM, Analytics, Email, Calendar, Social Media',
  events: 'Event Platform, CRM, Email, Calendar, SMS',
  food: 'Inventory, POS, Email, Calendar, CRM',
  relationships: 'CRM, Calendar, Email, SMS, Video',
  spiritual: 'Calendar, Email, Video, CRM',
  infrastructure: 'Jira, Slack, Email, Monitoring Tools',
  default: 'Slack, Email, Calendar, CRM',
};

// Vertical → connectors
const VERTICAL_CONNECTORS = {
  real_estate: 'MLS, DocuSign, Calendly, Slack, Email, SMS',
  hospitality: 'Booking.com, OpenTable, Slack, Email, SMS, Calendar',
  health: 'EHR API, Calendly, SMS, Email, Video',
  legal: 'Clio, DocuSign, Email, Calendar, SMS',
  wealth: 'WealthBox, DocuSign, Email, Calendar',
  finance: 'QuickBooks, Plaid, Email, Slack',
  creator: 'Instagram, YouTube, TikTok, Email, Calendar',
  commerce: 'Shopify, Stripe, Email, Slack, SMS',
  education: 'Canvas, Zoom, Email, SMS, Calendar',
  corporate: 'Slack, Gmail, Google Calendar, Jira, Notion',
  core: 'Slack, Gmail, Google Calendar, Jira, GitHub, Notion',
  crisis: 'Twilio SMS, Email, Zoom, CRM API',
  mental_health: 'SimplePractice, Zoom, SMS, Email',
  social_services: 'CaseWorthy, Email, SMS, Calendar',
  government: 'GovQA, Email, Calendar, SMS',
  tech: 'GitHub, Slack, Jira, Notion, Gmail',
  ai: 'OpenAI, HuggingFace, GitHub, Slack, Pinecone',
  manufacturing: 'SAP, Slack, Email, Calendar',
  sustainability: 'Carbon Analytics, Email, CRM',
  media: 'YouTube, Vimeo, Social Media APIs, Email',
  sports: 'Strava, Social Media, Email, CRM',
  events: 'Eventbrite, Mailchimp, Email, SMS',
  food: 'Toast, Square, Email, SMS, Calendar',
  relationships: 'Calendly, Email, SMS, Zoom',
  spiritual: 'Calendly, Email, Zoom, SMS',
  infrastructure: 'Jira, PagerDuty, Slack, Email',
  default: 'Slack, Email, Calendar, SMS, CRM API',
};

// Capabilities by role_type
const ROLE_CAPABILITIES = {
  CORE: ['system_orchestration', 'governance', 'blueprint_management', 'identity_management', 'cross_system_coordination', 'strategic_planning', 'performance_monitoring', 'resource_allocation'],
  VERTICAL: ['domain_specialization', 'lead_management', 'client_intake', 'service_delivery', 'vertical_analytics', 'industry_compliance', 'client_communication', 'scheduling'],
  BRIDGE: ['cross_vertical_routing', 'context_carriage', 'data_synthesis', 'integration_orchestration', 'protocol_translation', 'handoff_management', 'state_preservation', 'bridge_analytics'],
  CROSS_SYSTEM: ['intelligence_gathering', 'pattern_analysis', 'trend_prediction', 'data_synthesis', 'cross_domain_insight', 'reporting', 'strategic_recommendations', 'anomaly_detection'],
  UTILITY: ['task_execution', 'workflow_automation', 'monitoring', 'alerting', 'scheduled_operations', 'resource_optimization', 'maintenance', 'logging'],
  CRISIS: ['crisis_detection', 'emergency_routing', 'risk_assessment', 'safety_escalation', 'resource_coordination', 'de_escalation', 'incident_tracking', 'follow_up_monitoring'],
};

// MAS category thresholds
function getMasCategory(score) {
  if (score === null || score === undefined) return 'UNRATED';
  if (score >= 85) return 'ELITE';
  if (score >= 70) return 'ADVANCED';
  if (score >= 50) return 'STANDARD';
  return 'BASIC';
}

// Packs (from user's structure)
function getPack(roleType, vertical) {
  const packs = [];
  if (roleType === 'CORE') packs.push('core_pack');
  if (['CRISIS', 'BRIDGE'].includes(roleType)) packs.push('governance_pack');
  if (roleType === 'VERTICAL') packs.push('domain_pack');
  if (roleType === 'BRIDGE') packs.push('case_pack');
  if (roleType === 'UTILITY') packs.push('human_support_pack');
  if (roleType === 'CROSS_SYSTEM') packs.push('core_pack', 'governance_pack');
  // Domain-specific pack
  const domain = ['real_estate','hospitality','health','legal','wealth','finance',
    'creator','education','crisis','mental_health','social_services'].includes(vertical);
  if (domain) packs.push('domain_pack');
  return packs;
}

// ============================================================
// 2. NAME-BASED TAGLINE GENERATOR
// ============================================================

function generateTagline(agentName, roleType, vertical) {
  const name = agentName || '';
  const lc = name.toLowerCase();
  
  // Map known agents to taglines
  const taglines = {
    'Executive Twin': 'Your executive command center',
    'Communication Sovereign': 'Every message lands with precision',
    'Time Architecture Agent': 'Protects your time like a $500/hr EA',
    'Operations Command Agent': 'Nothing falls through. Everything runs on rails.',
    'Revenue Intelligence Agent': 'Finds the money. Tracks it. Closes it.',
    'Identity Architect Agent': 'Builds the self-concept that commands every room',
    'Blueprint Strategist Agent': 'Your vision, architected',
    'Governance Intelligence Agent': 'Rules that protect. Standards that scale.',
    'Master Conductor': 'The central nervous system of everything',
    'Swarm Orchestrator': 'Coordinates the collective intelligence',
    'Meta Intelligence': 'Intelligence about intelligence',
    'Evolution Orchestrator': 'Drives system evolution',
    'Client Concierge': 'Your front desk never sleeps',
    'Concierge Intelligence': 'Intelligent routing for every guest',
    'Operations Orchestrator': 'Orchestrates operations at scale',
    'Data Analytics Agent': 'Patterns become predictions',
    'Document Intelligence Engine': 'Documents that understand themselves',
    'Employee Intelligence Engine': 'Know your workforce, empower your team',
    'Intelligence Analyst': 'Patterns become predictions',
    'Market Intel Agent': 'Know your market, win your market',
    'Marketing Intelligence Agent': 'Every campaign, optimized',
    'Treatment Intelligence Engine': 'Recommendations that convert',
    'Property Match Intelligence': 'The perfect property finds you',
    'Billing Automation Agent': 'Bills that never bounce',
    'Compliance Monitor': 'Rules enforced. Risks reduced.',
    'Onboarding Automator': 'Onboarding that feels effortless',
    'Operations Sentinel': 'Watching while you work',
    'Research Associate': 'Research at your service',
    'Talent Acquisition Agent': 'Finding the right fit, every time',
    'Workforce Planner': 'The right people, right place, right time',
    'Manufacturing Automation Agent': 'Automation that manufactures results',
    'AI Twin Manager': 'Your AI, your clone',
  };
  
  if (taglines[agentName]) return taglines[agentName];
  
  // Generic generation
  if (lc.includes('bridge')) return `Connecting ${vertical || 'domains'} seamlessly`;
  if (lc.includes('crisis') || lc.includes('safety') || lc.includes('suicide') || lc.includes('naloxone')) return 'Safety first. Always.';
  if (lc.includes('detox') || lc.includes('addiction') || lc.includes('recovery') || lc.includes('relapse')) return 'Recovery is a journey. We walk it with you.';
  if (lc.includes('intake') || lc.includes('screening')) return `First impressions that ${vertical || 'work'}`;
  if (lc.includes('booking') || lc.includes('concierge')) return 'Every booking, every guest, perfectly handled';
  if (lc.includes('analytics') || lc.includes('intelligence') || lc.includes('analyst')) return 'Data becomes decisions';
  if (lc.includes('legal') || lc.includes('compliance') || lc.includes('audit')) return 'Risk managed. Compliance assured.';
  if (lc.includes('marketing') || lc.includes('audience') || lc.includes('brand')) return 'Your brand, amplified';
  if (lc.includes('sales') || lc.includes('lead')) return 'Every lead, qualified and closing';
  if (lc.includes('property') || lc.includes('listing') || lc.includes('real estate')) return 'Properties that perform';
  if (lc.includes('coach') || lc.includes('guidance') || lc.includes('therapist')) return 'Support that transforms';
  if (lc.includes('content') || lc.includes('studio') || lc.includes('creator')) return 'Create. Publish. Grow.';
  if (lc.includes('finance') || lc.includes('wealth') || lc.includes('portfolio')) return 'Wealth that works for you';
  if (lc.includes('manufacturing') || lc.includes('factory') || lc.includes('supply')) return 'Production optimized';
  if (lc.includes('sustainability') || lc.includes('green') || lc.includes('carbon')) return 'Sustainable. Profitable. Scalable.';
  if (lc.includes('education') || lc.includes('curriculum') || lc.includes('learning')) return 'Education that adapts';
  if (lc.includes('event') || lc.includes('planning')) return 'Events that impress';
  if (lc.includes('travel') || lc.includes('tour') || lc.includes('trip')) return 'Travel perfected';
  if (lc.includes('research')) return 'Discovery at your fingertips';
  
  return `${agentName || 'Agent'} for ${vertical || 'the Evolved Eden platform'}`;
}

function generateDescription(agentName, roleType, vertical) {
  const roleDescriptions = {
    CORE: `Platform-level ${agentName} that orchestrates, governs, and coordinates cross-system operations across the Evolved Eden ecosystem.`,
    VERTICAL: `Industry-specialized ${agentName} for the ${vertical} vertical, handling domain-specific workflows, client interactions, and vertical operations.`,
    BRIDGE: `Cross-vertical ${agentName} that carries context and coordinates handoffs between multiple domains within the Evolved Eden platform.`,
    CROSS_SYSTEM: `Intelligence ${agentName} that analyzes data across verticals, identifies patterns, and generates strategic insights for the Evolved Eden system.`,
    UTILITY: `${agentName} that handles operational tasks, automated workflows, and system maintenance within the Evolved Eden platform.`,
    CRISIS: `Safety-critical ${agentName} providing crisis detection, emergency routing, and risk mitigation within the Evolved Eden system.`,
  };
  return roleDescriptions[roleType] || `${agentName} operating within the ${vertical || 'Evolved Eden'} domain.`;
}

// ============================================================
// 3. MAIN
// ============================================================

async function main() {
  console.log('=== SEED AGENT FIELDS ===\n');

  // ---- 3a. Load all agents ----
  const agents = await pool.query(`
    SELECT a.agent_id, a.agent_name, a.vertical, a.role_type, a.avatar, a.archetype_id
    FROM agents a
    ORDER BY a.agent_id
  `);
  console.log(`Loaded ${agents.rows.length} agents\n`);

  // ---- 3b. Load evolved_eden_agents for MAS scores ----
  const ee = await pool.query('SELECT agent_id, mas, reported_mas, capability, trust, activation, synergy, risk, evolution FROM evolved_eden_agents');
  const eeMap = {};
  for (const row of ee.rows) eeMap[row.agent_id] = row;

  // ---- 3c. Batch update agents ----
  console.log('=== UPDATING AGENT FIELDS ===');
  let count = 0;
  const BATCH_SIZE = 50;
  let batch = [];

  for (const agent of agents.rows) {
    const { agent_id: id, agent_name: name, vertical, role_type, avatar } = agent;
    const vert = vertical || 'core';
    const role = role_type || 'VERTICAL';
    
    // Determine agent_type
    let agentType;
    if (role === 'VERTICAL') {
      agentType = VERTICAL_AGENT_TYPE[vert] || 'intake_consultation';
    } else if (role === 'CROSS_SYSTEM') {
      const lcName = (name || '').toLowerCase();
      if (lcName.includes('analytics') || lcName.includes('data')) agentType = 'analytics_agent';
      else if (lcName.includes('forecast') || lcName.includes('market')) agentType = 'forecasting_agent';
      else if (lcName.includes('document') || lcName.includes('employee')) agentType = 'intelligence_agent';
      else agentType = 'intelligence_agent';
    } else if (role === 'UTILITY') {
      const lcName = (name || '').toLowerCase();
      if (lcName.includes('onboarding')) agentType = 'onboarding_agent';
      else if (lcName.includes('billing') || lcName.includes('automation')) agentType = 'batch_compute_agent';
      else if (lcName.includes('compliance') || lcName.includes('monitor') || lcName.includes('sentinel')) agentType = 'integration_agent';
      else if (lcName.includes('research')) agentType = 'intelligence_agent';
      else if (lcName.includes('talent') || lcName.includes('workforce')) agentType = 'onboarding_agent';
      else agentType = ROLE_TYPE_AGENT_TYPE[role] || 'batch_compute_agent';
    } else {
      agentType = ROLE_TYPE_AGENT_TYPE[role] || 'orchestration_agent';
    }

    // Behavior roles as specialties
    const behaviorRoles = BEHAVIOR_ROLES[role] || ['Generalist'];
    const domainSpecs = DOMAIN_SPECIALTIES[vert] || [];
    // Pick 2-3 relevant specialties based on agent name keywords
    const lcName = (name || '').toLowerCase();
    let matchedSpecs = domainSpecs.filter(s => lcName.includes(s.toLowerCase().replace(/ /g, '')) || lcName.includes(s.toLowerCase().split(' ')[0]));
    if (matchedSpecs.length === 0) matchedSpecs = domainSpecs.slice(0, 3);
    const specialties = [...behaviorRoles.slice(0, 3), ...matchedSpecs.slice(0, 3)];
    
    // Capabilities
    const caps = ROLE_CAPABILITIES[role] || ['general_operation'];
    
    // MAS score
    const masData = eeMap[id] || {};
    const masScore = masData.mas || masData.reported_mas || null;
    const masCategory = getMasCategory(masScore);
    
    // Vertical subs
    const vertSubs = VERTICAL_SUB_MAP[vert] || null;
    
    // Tools & connectors
    const tools = VERTICAL_TOOLS[vert] || VERTICAL_TOOLS.default || 'Slack, Email, Calendar, CRM';
    const connectors = VERTICAL_CONNECTORS[vert] || VERTICAL_CONNECTORS.default || 'Slack, Email, Calendar, SMS, CRM API';
    
    // Autonomy
    const auto = AUTONOMY[role] || { level: 'medium', authority: 'medium', risk: 'low' };
    
    // Orchestration mode
    const orchMode = ORCHESTRATION_MODE[role] || 'managed';
    
    // Decision mode
    const decMode = DECISION_MODE[role] || 'WEIGHTED';
    
    // Evolution status
    const evoStatus = 'STABLE';
    
    // Tagline
    const tagline = generateTagline(name, role, vert);
    
    // Description
    const description = generateDescription(name, role, vert);
    
    // Icon
    const icon = ICONS[role] || '◆';
    
    // Avatar_id (uuid from avatars table - use avatar key as text since avatar_id is text type)
    const avatarId = avatar || 'nova';
    
    // Packs
    const packs = getPack(role, vert);
    
    // Is system agent & platform
    const isPlatform = true;
    const isSystemAgent = true;

    batch.push({
      id, agentType, orchMode, isPlatform, isSystemAgent,
      tagline, description, avatarId, vertSubs,
      evoStatus, decMode, auto, specialties, caps,
      tools, connectors, masScore, masCategory, packs,
      role // needed for icon lookup
    });
    
    count++;

    if (batch.length >= BATCH_SIZE) {
      await flushBatch(batch);
      batch = [];
      console.log(`  Progress: ${count}/${agents.rows.length}`);
    }
  }

  // Flush remaining
  if (batch.length > 0) {
    await flushBatch(batch);
  }
  console.log(`  Complete: ${count}/${agents.rows.length}\n`);

  // ---- 3d. Create swarms per vertical ----
  console.log('=== CREATING SWARMS PER VERTICAL ===');
  await createSwarms();
  
  // ---- 3e. Summary ----
  console.log('\n=== VERIFICATION ===');
  const r1 = await pool.query('SELECT COUNT(*) as total FROM agents');
  const r2 = await pool.query('SELECT COUNT(*) as filled FROM agents WHERE agent_type IS NOT NULL');
  const r3 = await pool.query('SELECT COUNT(*) as with_desc FROM agents WHERE description IS NOT NULL');
  const r4 = await pool.query('SELECT COUNT(*) as with_tag FROM agents WHERE tagline IS NOT NULL');
  const r5 = await pool.query('SELECT COUNT(*) as with_avatar FROM agents WHERE avatar_id IS NOT NULL');
  const r6 = await pool.query('SELECT COUNT(*) as with_mas FROM agents WHERE mas_score IS NOT NULL');
  const r7 = await pool.query('SELECT COUNT(*) as with_swarm FROM swarm_agents sa JOIN agents a ON sa.agent_id = a.id');
  console.log(`Total agents: ${r1.rows[0].total}`);
  console.log(`Agent type filled: ${r2.rows[0].filled}`);
  console.log(`Descriptions: ${r3.rows[0].with_desc}`);
  console.log(`Taglines: ${r4.rows[0].with_tag}`);
  console.log(`Avatar IDs: ${r5.rows[0].with_avatar}`);
  console.log(`MAS scores: ${r6.rows[0].with_mas}`);
  console.log(`Swarm assignments: ${r7.rows[0].with_swarm}`);

  await pool.end();
  console.log('\nDone!');
}

async function flushBatch(batch) {
  for (const b of batch) {
    // Build the vertical_subs array value
    const vertSubsSQL = b.vertSubs ? `ARRAY[${b.vertSubs.map(v => `'${v.replace(/'/g, "''")}'`).join(',')}]::text[]` : 'NULL';
    
    // Build specialties array
    const specsSQL = b.specialties.length > 0 
      ? `ARRAY[${b.specialties.map(s => `'${s.replace(/'/g, "''")}'`).join(',')}]::text[]`
      : `'{}'::text[]`;

    await pool.query(`
      UPDATE agents SET
        agent_type = $1,
        orchestration_mode = $2,
        is_platform = $3,
        is_system_agent = $4,
        tagline = $5,
        description = $6,
        avatar_id = $7,
        evolution_status = $8,
        decision_mode = $9,
        autonomy_level = $10,
        authority_level = $11,
        risk_level = $12,
        capabilities = $13::jsonb,
        tools = $14,
        connectors = $15,
        mas_score = $16,
        mas_category = $17,
        metadata = metadata || $18::jsonb
      WHERE agent_id = $19
    `, [
      b.agentType,
      b.orchMode,
      b.isPlatform,
      b.isSystemAgent,
      b.tagline,
      b.description,
      b.avatarId,
      b.evoStatus,
      b.decMode,
      b.auto.level,
      b.auto.authority,
      b.auto.risk,
      JSON.stringify(b.caps),
      b.tools,
      b.connectors,
      b.masScore,
      b.masCategory,
      JSON.stringify({ packs: b.packs }),
      b.id,
    ]);

    // Update icon separately (text array type)
    const iconVal = ICONS[b.role] || 'default';
    await pool.query(`UPDATE agents SET icon = ARRAY[$1]::text[] WHERE agent_id = $2`, [iconVal, b.id]);

    // Update specialties separately (text array)
    await pool.query(`
      UPDATE agents SET specialties = ${specsSQL} WHERE agent_id = $1
    `, [b.id]);
    
    // Update vertical_subs
    if (b.vertSubs) {
      await pool.query(`
        UPDATE agents SET vertical_subs = ${vertSubsSQL} WHERE agent_id = $1
      `, [b.id]);
    }
  }
}

async function createSwarms() {
  // Get distinct verticals
  const verts = await pool.query('SELECT DISTINCT vertical FROM agents WHERE vertical IS NOT NULL ORDER BY vertical');
  
  let swarmCount = 0;
  let assignCount = 0;
  
  for (const row of verts.rows) {
    const vert = row.vertical;
    const swarmName = `${vert.charAt(0).toUpperCase() + vert.slice(1)} Swarm`;
    const swarmSlug = `${vert.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_swarm`;
    const description = `Swarm of agents operating in the ${vert} vertical of Evolved Eden`;
    
    // Check if swarm already exists
    const existing = await pool.query('SELECT id FROM agent_swarms WHERE swarm_slug = $1', [swarmSlug]);
    
    let swarmId;
    if (existing.rows.length > 0) {
      swarmId = existing.rows[0].id;
    } else {
      const result = await pool.query(`
        INSERT INTO agent_swarms (swarm_name, swarm_slug, description, name, orchestration_strategy, memory_enabled, autonomous_enabled)
        VALUES ($1, $2, $3, $4, 'vertical', true, false)
        RETURNING id
      `, [swarmName, swarmSlug, description, swarmName]);
      swarmId = result.rows[0].id;
      swarmCount++;
    }
    
    // Get agents for this vertical
    const vertAgents = await pool.query(
      'SELECT id, agent_id FROM agents WHERE vertical = $1 ORDER BY agent_id',
      [vert]
    );
    
    // Assign agents to swarm (only if not already assigned)
    for (const agent of vertAgents.rows) {
      const exists = await pool.query(
        'SELECT id FROM swarm_agents WHERE swarm_id = $1 AND agent_id = $2',
        [swarmId, agent.id]
      );
      if (exists.rows.length === 0) {
        await pool.query(`
          INSERT INTO swarm_agents (swarm_id, agent_id, role, can_delegate)
          VALUES ($1, $2, 'member', true)
        `, [swarmId, agent.id]);
        assignCount++;
      }
    }
  }
  
  console.log(`  Swarms created: ${swarmCount}`);
  console.log(`  Agents assigned to swarms: ${assignCount}`);
}

main().catch(err => {
  console.error('FATAL:', err);
  process.exit(1);
});
