/**
 * seed-expanded-layers.mjs
 *
 * Phase 9+: Identity/tenancy, routing rules, SLA policies,
 * approval matrix, integration endpoints, model configs,
 * workflow states/transitions, webhook endpoints.
 *
 * Builds on all previous phases.
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

async function main() {
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║     EXPANDED SEED LAYERS (Phase 9+)         ║');
  console.log('╚══════════════════════════════════════════════╝\n');

  // ============================================================
  // MODULE A: Identity & Tenancy
  // ============================================================
  console.log('▓▓▓ MODULE A: IDENTITY & TENANCY ▓▓▓\n');

  // A1. Link existing users to organizations via organization_members
  const orgs = await pool.query('SELECT id, name FROM organizations WHERE name LIKE $1', ['Zuri%']);
  const users = await pool.query("SELECT id, full_name FROM users WHERE full_name IS NOT NULL");
  console.log(`Orgs: ${orgs.rows.length}, Users with names: ${users.rows.length}`);

  let memberCount = 0;
  if (orgs.rows.length > 0 && users.rows.length > 0) {
    const zuriOrgId = orgs.rows[0].id;
    for (const user of users.rows) {
      const exists = await pool.query(
        'SELECT id FROM organization_members WHERE organization_id = $1 AND user_id = $2',
        [zuriOrgId, user.id]
      );
      if (exists.rows.length === 0) {
        const role = user.full_name?.toLowerCase().includes('admin') ? 'admin' : 'member';
        await pool.query(`
          INSERT INTO organization_members (organization_id, user_id, role, is_active)
          VALUES ($1, $2, $3::text::public.org_role_enum, true)
        `, [zuriOrgId, user.id, role]);
        memberCount++;
      }
    }
  }
  console.log(`  ✓ Created ${memberCount} organization members`);

  // ============================================================
  // MODULE B: Create + seed new infrastructure tables
  // ============================================================
  console.log('\n▓▓▓ MODULE B: INFRASTRUCTURE TABLES ▓▓▓\n');

  // B1. workflow_states
  console.log('→ Creating workflow_states...');
  await pool.query(`
    CREATE TABLE IF NOT EXISTS workflow_states (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      workflow_key text REFERENCES workflow_templates(key) ON DELETE CASCADE,
      state text NOT NULL CHECK (state IN ('draft','pending','active','paused','maintenance','read_only','draining','failed','retired')),
      is_initial boolean DEFAULT false,
      is_terminal boolean DEFAULT false,
      metadata jsonb DEFAULT '{}',
      created_at timestamptz DEFAULT now()
    )
  `);
  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_workflow_states_workflow_state 
    ON workflow_states(workflow_key, state)
  `);
  console.log('  ✓ workflow_states table ready');

  // B2. state_transitions
  console.log('→ Creating state_transitions...');
  await pool.query(`
    CREATE TABLE IF NOT EXISTS state_transitions (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      workflow_key text REFERENCES workflow_templates(key) ON DELETE CASCADE,
      from_state text NOT NULL,
      to_state text NOT NULL,
      required_role text,
      requires_approval boolean DEFAULT false,
      trigger_type text DEFAULT 'manual',
      is_active boolean DEFAULT true,
      metadata jsonb DEFAULT '{}',
      created_at timestamptz DEFAULT now()
    )
  `);
  console.log('  ✓ state_transitions table ready');

  // B3. routing_rules
  console.log('→ Creating routing_rules...');
  await pool.query(`
    CREATE TABLE IF NOT EXISTS routing_rules (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      workflow_key text REFERENCES workflow_templates(key) ON DELETE CASCADE,
      capability_key text NOT NULL,
      agent_type_key text NOT NULL REFERENCES agent_types(key),
      priority integer DEFAULT 100,
      conditions jsonb DEFAULT '{}',
      is_active boolean DEFAULT true,
      created_at timestamptz DEFAULT now()
    )
  `);
  console.log('  ✓ routing_rules table ready');

  // B4. sla_policies
  console.log('→ Creating sla_policies...');
  await pool.query(`
    CREATE TABLE IF NOT EXISTS sla_policies (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      name text NOT NULL,
      workflow_group text,
      vertical_key text,
      priority text CHECK (priority IN ('critical','high','medium','low')),
      response_time_minutes integer,
      resolution_time_minutes integer,
      escalation_after_minutes integer,
      auto_escalate boolean DEFAULT true,
      is_active boolean DEFAULT true,
      created_at timestamptz DEFAULT now()
    )
  `);
  console.log('  ✓ sla_policies table ready');

  // B5. approval_matrix
  console.log('→ Creating approval_matrix...');
  await pool.query(`
    CREATE TABLE IF NOT EXISTS approval_matrix (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      name text NOT NULL,
      workflow_group text,
      approval_level integer NOT NULL DEFAULT 1,
      approver_role text,
      max_amount numeric,
      requires_second_approval boolean DEFAULT false,
      escalation_level integer DEFAULT 1,
      is_active boolean DEFAULT true,
      created_at timestamptz DEFAULT now()
    )
  `);
  console.log('  ✓ approval_matrix table ready');

  // B6. integration_endpoints
  console.log('→ Creating integration_endpoints...');
  await pool.query(`
    CREATE TABLE IF NOT EXISTS integration_endpoints (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      name text NOT NULL,
      provider text NOT NULL,
      endpoint_type text NOT NULL,
      config_template jsonb DEFAULT '{}',
      is_active boolean DEFAULT true,
      created_at timestamptz DEFAULT now()
    )
  `);
  console.log('  ✓ integration_endpoints table ready');

  // B7. model_configs
  console.log('→ Creating model_configs...');
  await pool.query(`
    CREATE TABLE IF NOT EXISTS model_configs (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      provider text NOT NULL,
      model_name text NOT NULL,
      display_name text,
      max_tokens integer DEFAULT 4000,
      default_temperature numeric DEFAULT 0.7,
      capabilities jsonb DEFAULT '[]',
      cost_per_1k_input numeric DEFAULT 0,
      cost_per_1k_output numeric DEFAULT 0,
      is_active boolean DEFAULT true,
      created_at timestamptz DEFAULT now()
    )
  `);
  console.log('  ✓ model_configs table ready');

  // B8. webhook_endpoints
  console.log('→ Creating webhook_endpoints...');
  await pool.query(`DROP TABLE IF EXISTS webhook_endpoints CASCADE`);
  await pool.query(`
    CREATE TABLE webhook_endpoints (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      name text NOT NULL,
      webhook_path text UNIQUE NOT NULL,
      provider text,
      event_types text[] DEFAULT '{}',
      secret_key text,
      is_active boolean DEFAULT true,
      created_at timestamptz DEFAULT now()
    )
  `);
  console.log('  ✓ webhook_endpoints table ready');

  // B9. execution_templates (n8n subflow templates)
  console.log('→ Creating execution_templates...');
  await pool.query(`
    CREATE TABLE IF NOT EXISTS execution_templates (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      key text UNIQUE NOT NULL,
      name text NOT NULL,
      description text,
      template_type text NOT NULL,
      workflow_key text REFERENCES workflow_templates(key) ON DELETE SET NULL,
      nodes jsonb DEFAULT '[]',
      connections jsonb DEFAULT '{}',
      trigger_type text DEFAULT 'event',
      is_active boolean DEFAULT true,
      created_at timestamptz DEFAULT now()
    )
  `);
  console.log('  ✓ execution_templates table ready');

  // B10. prompt_versions (versioned prompt tracking)
  console.log('→ Creating prompt_versions...');
  await pool.query(`
    CREATE TABLE IF NOT EXISTS prompt_versions (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      prompt_key text REFERENCES agent_prompts(key) ON DELETE CASCADE,
      version integer NOT NULL,
      prompt_template text NOT NULL,
      change_log text,
      created_by text,
      created_at timestamptz DEFAULT now()
    )
  `);
  console.log('  ✓ prompt_versions table ready');

  // ============================================================
  // MODULE C: Seed routing_rules from workflow catalog
  // ============================================================
  console.log('\n▓▓▓ MODULE C: ROUTING RULES ▓▓▓\n');

  const wfTemplates = await pool.query(`
    SELECT key, name, agent_assignments FROM workflow_templates 
    WHERE is_active = true AND workflow_type != 'n8n_template'
  `);
  console.log(`Building routing rules for ${wfTemplates.rows.length} workflows...`);

  let routingCount = 0;
  for (const wf of wfTemplates.rows) {
    const aa = wf.agent_assignments;
    if (!aa || !aa.required_capabilities) continue;
    
    for (const cap of aa.required_capabilities) {
      // Map capability to agent_type_key
      const capAgentMap = {
        form_intake: 'intake_agent', ticket_creation: 'intake_agent', event_registration: 'intake_agent',
        webhook_receipt: 'intake_agent', data_validation: 'intake_agent',
        rule_based_routing: 'router_agent', ml_routing: 'router_agent', queue_assignment: 'router_agent',
        owner_assignment: 'router_agent', round_robin: 'router_agent', territory_assignment: 'router_agent',
        external_api_enrichment: 'enrichment_agent', llm_enrichment: 'enrichment_agent', data_append: 'enrichment_agent',
        research_brief: 'enrichment_agent', contact_validation: 'enrichment_agent',
        lead_scoring: 'scoring_agent', churn_scoring: 'scoring_agent', priority_scoring: 'scoring_agent',
        risk_scoring: 'scoring_agent', mql_scoring: 'scoring_agent', sentiment_scoring: 'scoring_agent',
        task_creation: 'task_agent', sequence_enrollment: 'task_agent', checklist_execution: 'task_agent',
        sla_tracking: 'task_agent', onboarding_steps: 'task_agent', follow_up_creation: 'task_agent',
        email_notification: 'notification_agent', slack_notification: 'notification_agent',
        sms_notification: 'notification_agent', reminder_dispatch: 'notification_agent',
        alert_broadcast: 'notification_agent', digest_generation: 'notification_agent',
        document_generation: 'document_agent', proposal_creation: 'document_agent',
        contract_drafting: 'document_agent', invoice_generation: 'document_agent',
        report_generation: 'document_agent', ocr_processing: 'document_agent',
        crm_sync: 'sync_agent', data_warehouse_sync: 'sync_agent', system_reconciliation: 'sync_agent',
        data_deduplication: 'sync_agent', master_data_management: 'sync_agent',
        anomaly_detection: 'monitoring_agent', sla_monitoring: 'monitoring_agent',
        threshold_alerting: 'monitoring_agent', health_check: 'monitoring_agent',
        usage_tracking: 'monitoring_agent', audit_logging: 'monitoring_agent',
        approval_chain: 'approval_agent', human_handoff: 'approval_agent',
        escalation_routing: 'approval_agent', approval_state_machine: 'approval_agent',
        signature_collection: 'approval_agent',
        kpi_aggregation: 'analytics_agent', dashboard_refresh: 'analytics_agent',
        executive_summary: 'analytics_agent', trend_analysis: 'analytics_agent',
        forecast_reporting: 'analytics_agent', attribution_analysis: 'analytics_agent',
        llm_summarization: 'knowledge_agent', text_classification: 'knowledge_agent',
        content_generation: 'knowledge_agent', research_synthesis: 'knowledge_agent',
        qa_automation: 'knowledge_agent', knowledge_base_mgmt: 'knowledge_agent',
      };
      const agentTypeKey = capAgentMap[cap] || 'intake_agent';
      const exists = await pool.query(
        'SELECT id FROM routing_rules WHERE workflow_key = $1 AND capability_key = $2',
        [wf.key, cap]
      );
      if (exists.rows.length === 0) {
        await pool.query(`
          INSERT INTO routing_rules (workflow_key, capability_key, agent_type_key, priority, is_active)
          VALUES ($1, $2, $3, 100, true)
        `, [wf.key, cap, agentTypeKey]);
        routingCount++;
      }
    }
  }
  console.log(`  ✓ Inserted ${routingCount} routing rules`);

  // ============================================================
  // MODULE D: Seed SLA Policies
  // ============================================================
  console.log('\n▓▓▓ MODULE D: SLA POLICIES ▓▓▓\n');

  const SLA_POLICIES = [
    { name: 'Critical Support SLA', group: 'Support', vert: null, pri: 'critical', resp: 15, resolv: 240, escal: 60 },
    { name: 'High Priority Support SLA', group: 'Support', vert: null, pri: 'high', resp: 60, resolv: 480, escal: 180 },
    { name: 'Medium Support SLA', group: 'Support', vert: null, pri: 'medium', resp: 240, resolv: 1440, escal: 480 },
    { name: 'Low Support SLA', group: 'Support', vert: null, pri: 'low', resp: 1440, resolv: 4320, escal: 2880 },
    { name: 'Critical Security SLA', group: 'Security', vert: null, pri: 'critical', resp: 5, resolv: 60, escal: 20 },
    { name: 'High Security SLA', group: 'Security', vert: null, pri: 'high', resp: 30, resolv: 240, escal: 60 },
    { name: 'Sales Lead SLA', group: 'Lead Management', vert: null, pri: 'high', resp: 15, resolv: 120, escal: 60 },
    { name: 'Sales Ops SLA', group: 'Sales Ops', vert: null, pri: 'high', resp: 30, resolv: 240, escal: 120 },
    { name: 'Deal Desk SLA', group: 'Deal Desk', vert: null, pri: 'high', resp: 60, resolv: 480, escal: 240 },
    { name: 'Finance Ops SLA', group: 'AR/AP', vert: null, pri: 'high', resp: 120, resolv: 1440, escal: 480 },
    { name: 'HR Ops SLA', group: 'Talent', vert: null, pri: 'medium', resp: 240, resolv: 2880, escal: 720 },
    { name: 'IT Ops SLA', group: 'Incidents', vert: null, pri: 'high', resp: 30, resolv: 240, escal: 60 },
    { name: 'Clinical Ops SLA', group: 'Clinical Ops', vert: null, pri: 'critical', resp: 10, resolv: 120, escal: 30 },
    { name: 'Supply Chain SLA', group: 'Supply Chain', vert: null, pri: 'high', resp: 30, resolv: 240, escal: 120 },
    { name: 'Procurement SLA', group: 'Procurement', vert: null, pri: 'medium', resp: 240, resolv: 2880, escal: 720 },
    { name: 'Legal Ops SLA', group: 'Contracts', vert: null, pri: 'medium', resp: 480, resolv: 4320, escal: 1440 },
    { name: 'Compliance SLA', group: 'Audit', vert: null, pri: 'high', resp: 120, resolv: 1440, escal: 480 },
    { name: 'Data Ops SLA', group: 'Data Ops', vert: null, pri: 'high', resp: 60, resolv: 480, escal: 240 },
    { name: 'Marketing SLA', group: 'Campaigns', vert: null, pri: 'medium', resp: 240, resolv: 1440, escal: 480 },
    { name: 'Monitoring SLA', group: 'Monitoring', vert: null, pri: 'critical', resp: 5, resolv: 60, escal: 15 },
  ];

  let slaCount = 0;
  for (const s of SLA_POLICIES) {
    const exists = await pool.query('SELECT id FROM sla_policies WHERE name = $1', [s.name]);
    if (exists.rows.length === 0) {
      await pool.query(`
        INSERT INTO sla_policies (name, workflow_group, priority, response_time_minutes, resolution_time_minutes, escalation_after_minutes, auto_escalate, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, true, true)
      `, [s.name, s.group, s.pri, s.resp, s.resolv, s.escal]);
      slaCount++;
    }
  }
  console.log(`  ✓ Inserted ${slaCount} SLA policies`);

  // ============================================================
  // MODULE E: Seed Approval Matrix
  // ============================================================
  console.log('\n▓▓▓ MODULE E: APPROVAL MATRIX ▓▓▓\n');

  const APPROVAL_RULES = [
    { name: 'Deal Desk Level 1', group: 'Deal Desk', level: 1, role: 'sales_manager', max: 25000, second: false, escal: 1 },
    { name: 'Deal Desk Level 2', group: 'Deal Desk', level: 2, role: 'sales_director', max: 100000, second: false, escal: 2 },
    { name: 'Deal Desk Level 3', group: 'Deal Desk', level: 3, role: 'vp_sales', max: 500000, second: true, escal: 3 },
    { name: 'Deal Desk Level 4', group: 'Deal Desk', level: 4, role: 'cfo', max: null, second: true, escal: 4 },
    { name: 'Discount Level 1', group: 'Discount', level: 1, role: 'sales_manager', max: 5000, second: false, escal: 1 },
    { name: 'Discount Level 2', group: 'Discount', level: 2, role: 'sales_director', max: 25000, second: false, escal: 2 },
    { name: 'Discount Level 3', group: 'Discount', level: 3, role: 'vp_sales', max: null, second: true, escal: 3 },
    { name: 'Contract Level 1', group: 'Contracts', level: 1, role: 'legal_counsel', max: null, second: true, escal: 1 },
    { name: 'Contract Level 2', group: 'Contracts', level: 2, role: 'general_counsel', max: null, second: false, escal: 2 },
    { name: 'Invoice Level 1', group: 'AR/AP', level: 1, role: 'finance_manager', max: 10000, second: false, escal: 1 },
    { name: 'Invoice Level 2', group: 'AR/AP', level: 2, role: 'controller', max: 100000, second: false, escal: 2 },
    { name: 'Invoice Level 3', group: 'AR/AP', level: 3, role: 'cfo', max: null, second: true, escal: 3 },
    { name: 'Purchase Order Level 1', group: 'Procurement', level: 1, role: 'ops_manager', max: 5000, second: false, escal: 1 },
    { name: 'Purchase Order Level 2', group: 'Procurement', level: 2, role: 'procurement_director', max: 50000, second: false, escal: 2 },
    { name: 'Purchase Order Level 3', group: 'Procurement', level: 3, role: 'cfo', max: null, second: true, escal: 3 },
    { name: 'Expense Level 1', group: 'Expenses', level: 1, role: 'manager', max: 1000, second: false, escal: 1 },
    { name: 'Expense Level 2', group: 'Expenses', level: 2, role: 'finance_manager', max: 10000, second: false, escal: 2 },
    { name: 'HR Offer Level 1', group: 'Talent', level: 1, role: 'hr_manager', max: 100000, second: false, escal: 1 },
    { name: 'HR Offer Level 2', group: 'Talent', level: 2, role: 'hr_director', max: 250000, second: false, escal: 2 },
    { name: 'HR Offer Level 3', group: 'Talent', level: 3, role: 'ceo', max: null, second: true, escal: 3 },
    { name: 'Access Level 1', group: 'Access', level: 1, role: 'it_manager', max: null, second: false, escal: 1 },
    { name: 'Access Level 2', group: 'Access', level: 2, role: 'security_officer', max: null, second: true, escal: 2 },
  ];

  let approvalCount = 0;
  for (const a of APPROVAL_RULES) {
    const exists = await pool.query('SELECT id FROM approval_matrix WHERE name = $1', [a.name]);
    if (exists.rows.length === 0) {
      await pool.query(`
        INSERT INTO approval_matrix (name, workflow_group, approval_level, approver_role, max_amount, requires_second_approval, escalation_level, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, $7, true)
      `, [a.name, a.group, a.level, a.role, a.max, a.second, a.escal]);
      approvalCount++;
    }
  }
  console.log(`  ✓ Inserted ${approvalCount} approval rules`);

  // ============================================================
  // MODULE F: Seed Integration Endpoints
  // ============================================================
  console.log('\n▓▓▓ MODULE F: INTEGRATION ENDPOINTS ▓▓▓\n');

  const ENDPOINTS = [
    { n: 'Slack Webhook', p: 'slack', t: 'webhook', cfg: { webhook_url: 'https://hooks.slack.com/services/{{workspace}}/{{channel}}/{{token}}', channel: '#general' } },
    { n: 'SendGrid Email', p: 'sendgrid', t: 'smtp', cfg: { api_key: '{{api_key}}', from_email: 'noreply@evolvededen.com', from_name: 'Evolve Eden' } },
    { n: 'Twilio SMS', p: 'twilio', t: 'api', cfg: { account_sid: '{{account_sid}}', auth_token: '{{auth_token}}', from_number: '{{from_number}}' } },
    { n: 'SMTP Relay', p: 'smtp', t: 'smtp', cfg: { host: 'smtp.evolvededen.com', port: 587, secure: false } },
    { n: 'Calendar API (Google)', p: 'google_calendar', t: 'oauth2', cfg: { scopes: ['https://www.googleapis.com/auth/calendar'], redirect_uri: '{{base_url}}/auth/callback' } },
    { n: 'Calendar API (Outlook)', p: 'outlook_calendar', t: 'oauth2', cfg: { scopes: ['Calendars.ReadWrite'], redirect_uri: '{{base_url}}/auth/callback' } },
    { n: 'CRM API (HubSpot)', p: 'hubspot', t: 'oauth2', cfg: { scopes: ['crm.objects.contacts.read','crm.objects.deals.write'], redirect_uri: '{{base_url}}/auth/callback' } },
    { n: 'CRM API (Salesforce)', p: 'salesforce', t: 'oauth2', cfg: { instance_url: 'https://{{instance}}.salesforce.com', api_version: 'v58.0' } },
    { n: 'DocuSign API', p: 'docusign', t: 'oauth2', cfg: { scopes: ['signature','impersonation'], account_id: '{{account_id}}' } },
    { n: 'OpenAI API', p: 'openai', t: 'api', cfg: { model: 'gpt-4o', max_tokens: 4000, temperature: 0.7 } },
    { n: 'Anthropic API', p: 'anthropic', t: 'api', cfg: { model: 'claude-3-opus-20240229', max_tokens: 4096 } },
    { n: 'Stripe API', p: 'stripe', t: 'api', cfg: { api_version: '2023-10-16', webhook_secret: '{{webhook_secret}}' } },
    { n: 'QuickBooks API', p: 'quickbooks', t: 'oauth2', cfg: { scopes: ['com.intuit.quickbooks.accounting'], redirect_uri: '{{base_url}}/auth/callback' } },
    { n: 'Slack Events API', p: 'slack', t: 'events', cfg: { events: ['message.channels','app_mention'], signing_secret: '{{signing_secret}}' } },
    { n: 'Shopify API', p: 'shopify', t: 'api', cfg: { store: '{{store}}.myshopify.com', api_version: '2024-01' } },
    { n: 'Zoom API', p: 'zoom', t: 'oauth2', cfg: { scopes: ['meeting:write','user:read'], redirect_uri: '{{base_url}}/auth/callback' } },
  ];

  let epCount = 0;
  for (const ep of ENDPOINTS) {
    const exists = await pool.query('SELECT id FROM integration_endpoints WHERE name = $1', [ep.n]);
    if (exists.rows.length === 0) {
      await pool.query(`
        INSERT INTO integration_endpoints (name, provider, endpoint_type, config_template, is_active)
        VALUES ($1, $2, $3, $4::jsonb, true)
      `, [ep.n, ep.p, ep.t, JSON.stringify(ep.cfg)]);
      epCount++;
    }
  }
  console.log(`  ✓ Inserted ${epCount} integration endpoints`);

  // ============================================================
  // MODULE G: Seed Model Configs
  // ============================================================
  console.log('\n▓▓▓ MODULE G: MODEL CONFIGS ▓▓▓\n');

  const MODELS = [
    { p: 'openai', m: 'gpt-4o', dn: 'GPT-4o', mt: 16384, tmp: 0.7, caps: ['text','vision','json'], cin: 2.50, cout: 10.00 },
    { p: 'openai', m: 'gpt-4o-mini', dn: 'GPT-4o Mini', mt: 16384, tmp: 0.7, caps: ['text','json'], cin: 0.15, cout: 0.60 },
    { p: 'openai', m: 'o3-mini', dn: 'o3 Mini', mt: 100000, tmp: 0.7, caps: ['text','json','reasoning'], cin: 1.10, cout: 4.40 },
    { p: 'anthropic', m: 'claude-3-5-sonnet-20241022', dn: 'Claude 3.5 Sonnet', mt: 8192, tmp: 0.7, caps: ['text','json'], cin: 3.00, cout: 15.00 },
    { p: 'anthropic', m: 'claude-3-5-haiku-20241022', dn: 'Claude 3.5 Haiku', mt: 8192, tmp: 0.7, caps: ['text','json'], cin: 0.80, cout: 4.00 },
    { p: 'google', m: 'gemini-2.0-flash', dn: 'Gemini 2.0 Flash', mt: 8192, tmp: 0.7, caps: ['text','vision','json'], cin: 0.10, cout: 0.40 },
    { p: 'google', m: 'gemini-2.0-pro', dn: 'Gemini 2.0 Pro', mt: 8192, tmp: 0.7, caps: ['text','vision','json'], cin: 0.35, cout: 1.05 },
  ];

  let modelCount = 0;
  for (const m of MODELS) {
    const exists = await pool.query('SELECT id FROM model_configs WHERE provider = $1 AND model_name = $2', [m.p, m.m]);
    if (exists.rows.length === 0) {
      await pool.query(`
        INSERT INTO model_configs (provider, model_name, display_name, max_tokens, default_temperature, capabilities, cost_per_1k_input, cost_per_1k_output, is_active)
        VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8, true)
      `, [m.p, m.m, m.dn, m.mt, m.tmp, JSON.stringify(m.caps), m.cin, m.cout]);
      modelCount++;
    }
  }
  console.log(`  ✓ Inserted ${modelCount} model configs`);

  // Fix existing state_transitions table
  try { await pool.query('ALTER TABLE state_transitions ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true');
  } catch(e) { /* ignore */ }

  // ============================================================
  // MODULE H: Seed Workflow States & Transitions
  // ============================================================
  console.log('\n▓▓▓ MODULE H: WORKFLOW STATES & TRANSITIONS ▓▓▓\n');

  const COMMON_STATES = ['draft','pending','active','paused','maintenance','failed','retired'];
  const COMMON_TRANSITIONS = [
    { from: 'draft', to: 'pending', role: 'admin', req: false, trig: 'manual' },
    { from: 'pending', to: 'active', role: 'admin', req: true, trig: 'approval' },
    { from: 'active', to: 'paused', role: 'operator', req: false, trig: 'manual' },
    { from: 'active', to: 'maintenance', role: 'admin', req: false, trig: 'manual' },
    { from: 'active', to: 'failed', role: null, req: false, trig: 'system' },
    { from: 'paused', to: 'active', role: 'operator', req: false, trig: 'manual' },
    { from: 'maintenance', to: 'active', role: 'admin', req: false, trig: 'manual' },
    { from: 'failed', to: 'active', role: 'admin', req: true, trig: 'approval' },
    { from: 'failed', to: 'retired', role: 'admin', req: true, trig: 'approval' },
    { from: 'active', to: 'retired', role: 'admin', req: true, trig: 'approval' },
    { from: 'paused', to: 'retired', role: 'admin', req: true, trig: 'approval' },
  ];

  // Ensure unique constraints exist for batch ON CONFLICT
  try { await pool.query('CREATE UNIQUE INDEX IF NOT EXISTS idx_ws_wf_state ON workflow_states (workflow_key, state)');
  } catch(e) { /* ignore */ }
  try { await pool.query('CREATE UNIQUE INDEX IF NOT EXISTS idx_st_wf_fr_to ON state_transitions (workflow_key, from_state, to_state)');
  } catch(e) { /* ignore */ }

  // Collect all workflow keys
  const allWorkflows = await pool.query('SELECT key FROM workflow_templates WHERE is_active = true');
  const wfKeys = allWorkflows.rows.map(r => r.key);

  // Batch insert workflow states (7 × N)
  const stateValues = wfKeys.flatMap(key =>
    COMMON_STATES.map(s => {
      const vals = [key, s, s === 'draft', s === 'retired'];
      return vals;
    })
  );
  if (stateValues.length > 0) {
    const placeholders = stateValues.map((_, i) => {
      const base = i * 4;
      return `($${base+1},$${base+2},$${base+3},$${base+4},'{}')`;
    });
    const flat = stateValues.flat();
    const r = await pool.query(`
      INSERT INTO workflow_states (workflow_key, state, is_initial, is_terminal, metadata)
      VALUES ${placeholders.join(',')}
      ON CONFLICT (workflow_key, state) DO NOTHING
    `, flat);
    console.log(`  ✓ Inserted ${r.rowCount} workflow states`);
  } else {
    console.log(`  ✓ Inserted 0 workflow states`);
  }

  // Batch insert state transitions (11 × N)
  const transValues = wfKeys.flatMap(key =>
    COMMON_TRANSITIONS.map(t => [key, t.from, t.to, t.role, t.req, t.trig])
  );
  if (transValues.length > 0) {
    const placeholders = transValues.map((_, i) => {
      const base = i * 6;
      return `($${base+1},$${base+2},$${base+3},$${base+4},$${base+5},$${base+6},true)`;
    });
    const flat = transValues.flat();
    const r = await pool.query(`
      INSERT INTO state_transitions (workflow_key, from_state, to_state, required_role, requires_approval, trigger_type, is_active)
      VALUES ${placeholders.join(',')}
      ON CONFLICT (workflow_key, from_state, to_state) DO NOTHING
    `, flat);
    console.log(`  ✓ Inserted ${r.rowCount} state transitions`);
  } else {
    console.log(`  ✓ Inserted 0 state transitions`);
  }

  // ============================================================
  // MODULE I: Seed Webhook Endpoints
  // ============================================================
  console.log('\n▓▓▓ MODULE I: WEBHOOK ENDPOINTS ▓▓▓\n');

  const WEBHOOKS = [
    { n: 'Inbound Lead Capture', path: '/webhooks/lead', prov: 'hubspot', events: ['contact.created','deal.created'] },
    { n: 'Inbound Ticket', path: '/webhooks/ticket', prov: 'zendesk', events: ['ticket.created','ticket.updated'] },
    { n: 'Payment Event', path: '/webhooks/payment', prov: 'stripe', events: ['payment_intent.succeeded','payment_intent.failed'] },
    { n: 'Calendar Event', path: '/webhooks/calendar', prov: 'google_calendar', events: ['event.created','event.updated'] },
    { n: 'Slack Events', path: '/webhooks/slack', prov: 'slack', events: ['message.im','app_mention'] },
    { n: 'Email Inbound', path: '/webhooks/email', prov: 'sendgrid', events: ['inbound_email'] },
    { n: 'Form Submission', path: '/webhooks/form', prov: 'typeform', events: ['form_response'] },
    { n: 'SMS Inbound', path: '/webhooks/sms', prov: 'twilio', events: ['inbound_sms'] },
  ];

  let whCount = 0;
  for (const w of WEBHOOKS) {
    const exists = await pool.query('SELECT id FROM webhook_endpoints WHERE webhook_path = $1', [w.path]);
    if (exists.rows.length === 0) {
      await pool.query(`
        INSERT INTO webhook_endpoints (name, webhook_path, provider, event_types, is_active)
        VALUES ($1, $2, $3, $4::text[], true)
      `, [w.n, w.path, w.prov, w.events]);
      whCount++;
    }
  }
  console.log(`  ✓ Inserted ${whCount} webhook endpoints`);

  // ============================================================
  // MODULE J: Seed Prompt Versions
  // ============================================================
  console.log('\n▓▓▓ MODULE J: PROMPT VERSIONS ▓▓▓\n');

  const prompts = await pool.query('SELECT key, prompt_template, name FROM agent_prompts');
  let pvCount = 0;
  for (const p of prompts.rows) {
    const exists = await pool.query(
      'SELECT id FROM prompt_versions WHERE prompt_key = $1 AND version = 1',
      [p.key]
    );
    if (exists.rows.length === 0) {
      await pool.query(`
        INSERT INTO prompt_versions (prompt_key, version, prompt_template, change_log, created_by)
        VALUES ($1, 1, $2, $3, 'system')
      `, [p.key, p.prompt_template, `Initial version of ${p.name}`]);
      pvCount++;
    }
  }
  console.log(`  ✓ Inserted ${pvCount} prompt versions`);

  // ============================================================
  // VERIFICATION
  // ============================================================
  console.log('\n▓▓▓ VERIFICATION ▓▓▓\n');

  const checks = [
    ['organization_members', 'SELECT COUNT(*) as cnt FROM organization_members'],
    ['workflow_states', 'SELECT COUNT(*) as cnt FROM workflow_states'],
    ['state_transitions', 'SELECT COUNT(*) as cnt FROM state_transitions'],
    ['routing_rules', 'SELECT COUNT(*) as cnt FROM routing_rules'],
    ['sla_policies', 'SELECT COUNT(*) as cnt FROM sla_policies'],
    ['approval_matrix', 'SELECT COUNT(*) as cnt FROM approval_matrix'],
    ['integration_endpoints', 'SELECT COUNT(*) as cnt FROM integration_endpoints'],
    ['model_configs', 'SELECT COUNT(*) as cnt FROM model_configs'],
    ['webhook_endpoints', 'SELECT COUNT(*) as cnt FROM webhook_endpoints'],
    ['prompt_versions', 'SELECT COUNT(*) as cnt FROM prompt_versions'],
    ['execution_templates', 'SELECT COUNT(*) as cnt FROM execution_templates'],
  ];
  for (const [name, sql] of checks) {
    const r = await pool.query(sql);
    console.log(`  ${name}: ${r.rows[0].cnt}`);
  }

  await pool.end();
  console.log('\n╔══════════════════════════════════════════════╗');
  console.log('║     EXPANDED SEED COMPLETE                  ║');
  console.log('╚══════════════════════════════════════════════╝');
}

main().catch(e => { console.error('FATAL:', e); process.exit(1); });
