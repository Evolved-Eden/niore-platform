/**
 * seed-workflow-system.mjs
 * 
 * Implements the capability-driven workflow architecture:
 * 1. Creates 12 agent primitives (behavioral roles)
 * 2. Adds capabilities to agent_capabilities table
 * 3. Extends workflow_templates table
 * 4. Parses the workflow catalog into workflow_templates
 * 5. Maps capabilities to workflows
 * 6. Connects agents to workflows
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
// 1. AGENT PRIMITIVES — The 12 behavioral roles
// ============================================================
const PRIMITIVES = [
  {
    key: 'intake_agent',
    name: 'Intake Agent',
    description: 'Handles inbound creation — forms, tickets, events, webhooks, registrations',
    capabilities: ['form_intake', 'ticket_creation', 'event_registration', 'webhook_receipt', 'data_validation'],
    runtime_type: 'event',
  },
  {
    key: 'router_agent',
    name: 'Router Agent',
    description: 'Applies rules/ML scoring to assign owner, queue, or next workflow step',
    capabilities: ['rule_based_routing', 'ml_routing', 'queue_assignment', 'owner_assignment', 'round_robin', 'territory_assignment'],
    runtime_type: 'rule',
  },
  {
    key: 'enrichment_agent',
    name: 'Enrichment Agent',
    description: 'Calls external APIs or LLMs to add data to records',
    capabilities: ['external_api_enrichment', 'llm_enrichment', 'data_append', 'research_brief', 'contact_validation'],
    runtime_type: 'api',
  },
  {
    key: 'scoring_agent',
    name: 'Scoring Agent',
    description: 'Computes scores — ICP fit, churn risk, priority, MQL, lead score',
    capabilities: ['lead_scoring', 'churn_scoring', 'priority_scoring', 'risk_scoring', 'mql_scoring', 'sentiment_scoring'],
    runtime_type: 'ml',
  },
  {
    key: 'task_agent',
    name: 'Task & Orchestration Agent',
    description: 'Creates tasks, sequences, checklists, triggers downstream flows',
    capabilities: ['task_creation', 'sequence_enrollment', 'checklist_execution', 'sla_tracking', 'onboarding_steps', 'follow_up_creation'],
    runtime_type: 'workflow',
  },
  {
    key: 'notification_agent',
    name: 'Notification Agent',
    description: 'Sends emails, Slack messages, SMS, reminders, alerts across channels',
    capabilities: ['email_notification', 'slack_notification', 'sms_notification', 'reminder_dispatch', 'alert_broadcast', 'digest_generation'],
    runtime_type: 'messaging',
  },
  {
    key: 'document_agent',
    name: 'Document Agent',
    description: 'Generates documents — quotes, proposals, contracts, invoices, reports',
    capabilities: ['document_generation', 'proposal_creation', 'contract_drafting', 'invoice_generation', 'report_generation', 'ocr_processing'],
    runtime_type: 'document',
  },
  {
    key: 'sync_agent',
    name: 'Sync Agent',
    description: 'Keeps systems in sync — CRM, CPQ, analytics, data warehouse, ERPs',
    capabilities: ['crm_sync', 'data_warehouse_sync', 'system_reconciliation', 'data_deduplication', 'master_data_management'],
    runtime_type: 'integration',
  },
  {
    key: 'monitoring_agent',
    name: 'Monitoring Agent',
    description: 'Watches for anomalies, SLA breaches, failures, threshold violations',
    capabilities: ['anomaly_detection', 'sla_monitoring', 'threshold_alerting', 'health_check', 'usage_tracking', 'audit_logging'],
    runtime_type: 'cron',
  },
  {
    key: 'approval_agent',
    name: 'Approval Agent',
    description: 'Human-in-the-loop workflows with state management, escalation, and approval chains',
    capabilities: ['approval_chain', 'human_handoff', 'escalation_routing', 'approval_state_machine', 'signature_collection'],
    runtime_type: 'state_machine',
  },
  {
    key: 'analytics_agent',
    name: 'Analytics & Reporting Agent',
    description: 'Aggregates data, generates dashboards, executive summaries, and KPI reports',
    capabilities: ['kpi_aggregation', 'dashboard_refresh', 'executive_summary', 'trend_analysis', 'forecast_reporting', 'attribution_analysis'],
    runtime_type: 'analytics',
  },
  {
    key: 'knowledge_agent',
    name: 'Knowledge & LLM Agent',
    description: 'Summarization, classification, research, QA, content generation, knowledge management',
    capabilities: ['llm_summarization', 'text_classification', 'content_generation', 'research_synthesis', 'qa_automation', 'knowledge_base_mgmt'],
    runtime_type: 'llm',
  },
];

// ============================================================
// 2. WORKFLOW CATALOG — CSV data parsed into objects
// ============================================================
const WORKFLOWS = [
  // Revenue and Sales
  {v:'Revenue and Sales',g:'Lead Management',n:'Lead capture from forms',f:'high',s:9,note:'Core inbound intake',caps:['form_intake','crm_sync']},
  {v:'Revenue and Sales',g:'Lead Management',n:'Lead deduplication',f:'high',s:8,note:'Best before routing',caps:['data_deduplication']},
  {v:'Revenue and Sales',g:'Lead Management',n:'Lead enrichment',f:'high',s:8,note:'Uses external data sources',caps:['external_api_enrichment','llm_enrichment']},
  {v:'Revenue and Sales',g:'Lead Management',n:'ICP fit scoring',f:'high',s:9,note:'Routing and prioritization',caps:['lead_scoring','priority_scoring']},
  {v:'Revenue and Sales',g:'Sales Ops',n:'Lead routing',f:'high',s:10,note:'Immediate assignment',caps:['rule_based_routing','owner_assignment']},
  {v:'Revenue and Sales',g:'Sales Ops',n:'Territory assignment',f:'weekly',s:8,note:'Rule based',caps:['rule_based_routing','territory_assignment']},
  {v:'Revenue and Sales',g:'Sales Ops',n:'Round-robin assignment',f:'high',s:10,note:'Simple automation',caps:['round_robin','owner_assignment']},
  {v:'Revenue and Sales',g:'Sales Ops',n:'MQL scoring',f:'high',s:8,note:'Marketing to sales handoff',caps:['mql_scoring','lead_scoring']},
  {v:'Revenue and Sales',g:'Sales Ops',n:'SQL qualification',f:'high',s:9,note:'Qualification and routing',caps:['lead_scoring','rule_based_routing']},
  {v:'Revenue and Sales',g:'Sales Ops',n:'SDR task creation',f:'high',s:10,note:'Task generation',caps:['task_creation','follow_up_creation']},
  {v:'Revenue and Sales',g:'Sales Ops',n:'Sales sequence enrollment',f:'high',s:10,note:'Outbound automation',caps:['sequence_enrollment','task_creation']},
  {v:'Revenue and Sales',g:'Sales Ops',n:'Meeting scheduling',f:'high',s:10,note:'Calendar workflow',caps:['form_intake','task_creation']},
  {v:'Revenue and Sales',g:'Sales Ops',n:'Meeting reminders',f:'high',s:10,note:'Notification workflow',caps:['reminder_dispatch','email_notification']},
  {v:'Revenue and Sales',g:'Sales Ops',n:'Prospect research brief generation',f:'high',s:7,note:'LLM assisted',caps:['llm_summarization','research_synthesis']},
  {v:'Revenue and Sales',g:'Sales Ops',n:'Account research brief generation',f:'high',s:7,note:'LLM assisted',caps:['llm_summarization','research_synthesis']},
  {v:'Revenue and Sales',g:'Sales Ops',n:'Contact role validation',f:'high',s:8,note:'CRM data hygiene',caps:['contact_validation','data_append']},
  {v:'Revenue and Sales',g:'Pipeline',n:'Opportunity creation',f:'high',s:10,note:'CRM record creation',caps:['crm_sync','form_intake']},
  {v:'Revenue and Sales',g:'Pipeline',n:'Opportunity stage updates',f:'high',s:10,note:'Event driven',caps:['crm_sync','monitoring_agent']},
  {v:'Revenue and Sales',g:'Deal Desk',n:'Deal desk approval routing',f:'medium',s:9,note:'Human approval',caps:['approval_chain','human_handoff','escalation_routing']},
  {v:'Revenue and Sales',g:'Deal Desk',n:'Quote generation',f:'high',s:9,note:'CPQ or template based',caps:['document_generation','proposal_creation']},
  {v:'Revenue and Sales',g:'Deal Desk',n:'Discount approval workflow',f:'medium',s:9,note:'Approval chain',caps:['approval_chain','human_handoff']},
  {v:'Revenue and Sales',g:'Contracts',n:'Contract redlining',f:'medium',s:7,note:'Legal assisted',caps:['document_generation','llm_summarization']},
  {v:'Revenue and Sales',g:'Contracts',n:'Contract approval',f:'medium',s:9,note:'Human approval',caps:['approval_chain','signature_collection']},
  {v:'Revenue and Sales',g:'Contracts',n:'CPQ sync',f:'high',s:10,note:'System sync',caps:['crm_sync','data_warehouse_sync']},
  {v:'Revenue and Sales',g:'Contracts',n:'Proposal generation',f:'high',s:8,note:'Template + LLM',caps:['document_generation','llm_summarization','proposal_creation']},
  {v:'Revenue and Sales',g:'Call Intelligence',n:'Sales call note capture',f:'high',s:9,note:'Post-call automation',caps:['llm_summarization','data_append']},
  {v:'Revenue and Sales',g:'Call Intelligence',n:'CRM note sync',f:'high',s:10,note:'Record update',caps:['crm_sync']},
  {v:'Revenue and Sales',g:'Forecasting',n:'Pipeline forecasting',f:'weekly',s:8,note:'Analytics',caps:['kpi_aggregation','trend_analysis','forecast_reporting']},
  {v:'Revenue and Sales',g:'Forecasting',n:'Forecast variance reporting',f:'weekly',s:8,note:'Analytics',caps:['kpi_aggregation','executive_summary']},
  {v:'Revenue and Sales',g:'Renewals',n:'Renewal pipeline creation',f:'weekly',s:9,note:'Recurring workflow',caps:['task_creation','crm_sync']},
  {v:'Revenue and Sales',g:'Renewals',n:'Renewal risk scoring',f:'weekly',s:8,note:'Predictive',caps:['churn_scoring','risk_scoring']},
  {v:'Revenue and Sales',g:'Expansion',n:'Upsell opportunity creation',f:'weekly',s:7,note:'Signal based',caps:['task_creation','crm_sync']},
  {v:'Revenue and Sales',g:'Expansion',n:'Cross-sell recommendation',f:'weekly',s:7,note:'Signal based',caps:['llm_enrichment','crm_sync']},
  {v:'Revenue and Sales',g:'Reporting',n:'Lost deal reason capture',f:'high',s:8,note:'Structured input',caps:['form_intake','data_append']},
  {v:'Revenue and Sales',g:'Reporting',n:'Sales KPI dashboard refresh',f:'daily',s:10,note:'Dashboard automation',caps:['kpi_aggregation','dashboard_refresh']},
  {v:'Revenue and Sales',g:'Reporting',n:'Executive sales summary',f:'weekly',s:8,note:'LLM summary',caps:['executive_summary','llm_summarization']},
  // Marketing and Demand
  {v:'Marketing and Demand',g:'Content',n:'Content idea intake',f:'high',s:8,note:'Open loop intake',caps:['form_intake','llm_summarization']},
  {v:'Marketing and Demand',g:'Content',n:'Content brief creation',f:'high',s:8,note:'LLM assisted',caps:['content_generation','llm_summarization']},
  {v:'Marketing and Demand',g:'Content',n:'Keyword research',f:'weekly',s:8,note:'SEO workflow',caps:['research_synthesis','llm_enrichment']},
  {v:'Marketing and Demand',g:'Content',n:'SERP analysis',f:'weekly',s:8,note:'SEO workflow',caps:['research_synthesis','trend_analysis']},
  {v:'Marketing and Demand',g:'Content',n:'Competitor content tracking',f:'weekly',s:7,note:'Monitoring',caps:['health_check','usage_tracking']},
  {v:'Marketing and Demand',g:'Campaigns',n:'Campaign launch checklist',f:'high',s:10,note:'Approval and launch',caps:['checklist_execution','approval_chain']},
  {v:'Marketing and Demand',g:'Campaigns',n:'Email campaign build',f:'high',s:9,note:'Template based',caps:['content_generation','email_notification']},
  {v:'Marketing and Demand',g:'Campaigns',n:'Email list segmentation',f:'high',s:9,note:'Rule and scoring',caps:['rule_based_routing','lead_scoring']},
  {v:'Marketing and Demand',g:'Campaigns',n:'Audience suppression list sync',f:'high',s:10,note:'Compliance critical',caps:['data_warehouse_sync','master_data_management']},
  {v:'Marketing and Demand',g:'Events',n:'Webinar registration handling',f:'high',s:10,note:'Registration flow',caps:['form_intake','event_registration','crm_sync']},
  {v:'Marketing and Demand',g:'Events',n:'Webinar reminder sequence',f:'high',s:10,note:'Notification flow',caps:['reminder_dispatch','email_notification','sms_notification']},
  {v:'Marketing and Demand',g:'Events',n:'Event lead capture',f:'high',s:10,note:'Inbound flow',caps:['form_intake','event_registration']},
  {v:'Marketing and Demand',g:'Paid Media',n:'Ad spend anomaly alerting',f:'daily',s:9,note:'Monitoring',caps:['anomaly_detection','threshold_alerting']},
  {v:'Marketing and Demand',g:'Paid Media',n:'Paid campaign UTM validation',f:'high',s:9,note:'QA gate',caps:['data_validation','health_check']},
  {v:'Marketing and Demand',g:'Web',n:'Landing page QA',f:'high',s:8,note:'Pre-launch check',caps:['checklist_execution','health_check']},
  {v:'Marketing and Demand',g:'Social',n:'Social post scheduling',f:'high',s:10,note:'Publishing automation',caps:['task_creation','email_notification']},
  {v:'Marketing and Demand',g:'Social',n:'Social listening alerts',f:'daily',s:8,note:'Monitoring',caps:['health_check','usage_tracking','threshold_alerting']},
  {v:'Marketing and Demand',g:'Social',n:'Brand mention tracking',f:'daily',s:8,note:'Monitoring',caps:['health_check','usage_tracking']},
  {v:'Marketing and Demand',g:'PR',n:'PR mention monitoring',f:'daily',s:7,note:'Monitoring',caps:['health_check','usage_tracking']},
  {v:'Marketing and Demand',g:'Analytics',n:'Marketing attribution sync',f:'daily',s:10,note:'Data sync',caps:['data_warehouse_sync','attribution_analysis']},
  {v:'Marketing and Demand',g:'Analytics',n:'Conversion rate reporting',f:'weekly',s:8,note:'Analytics',caps:['kpi_aggregation','trend_analysis','dashboard_refresh']},
  {v:'Marketing and Demand',g:'Analytics',n:'Weekly growth report',f:'weekly',s:8,note:'Executive summary',caps:['executive_summary','llm_summarization']},
  // Customer Success and Support
  {v:'Customer Success and Support',g:'Support',n:'Ticket intake',f:'high',s:10,note:'Inbound routing',caps:['form_intake','ticket_creation']},
  {v:'Customer Success and Support',g:'Support',n:'Ticket categorization',f:'high',s:9,note:'Classification',caps:['text_classification','llm_summarization']},
  {v:'Customer Success and Support',g:'Support',n:'Priority assignment',f:'high',s:9,note:'Triage',caps:['priority_scoring','rule_based_routing']},
  {v:'Customer Success and Support',g:'Support',n:'SLA breach alerts',f:'daily',s:10,note:'Monitoring',caps:['sla_monitoring','threshold_alerting','alert_broadcast']},
  {v:'Customer Success and Support',g:'Support',n:'Escalation routing',f:'high',s:10,note:'Human handoff',caps:['escalation_routing','human_handoff','queue_assignment']},
  {v:'Customer Success and Support',g:'Support',n:'Bug report forwarding',f:'high',s:9,note:'Engineering handoff',caps:['rule_based_routing','queue_assignment']},
  {v:'Customer Success and Support',g:'Billing',n:'Refund request triage',f:'high',s:9,note:'Policy gate',caps:['approval_chain','priority_scoring']},
  {v:'Customer Success and Support',g:'Voice of Customer',n:'CSAT survey sending',f:'weekly',s:10,note:'Automation',caps:['email_notification','task_creation']},
  {v:'Customer Success and Support',g:'Voice of Customer',n:'NPS survey sending',f:'weekly',s:10,note:'Automation',caps:['email_notification','task_creation']},
  {v:'Customer Success and Support',g:'Retention',n:'Churn risk scoring',f:'weekly',s:9,note:'Predictive',caps:['churn_scoring','risk_scoring','sentiment_scoring']},
  {v:'Customer Success and Support',g:'Retention',n:'Customer health scoring',f:'daily',s:9,note:'Predictive',caps:['health_check','risk_scoring','kpi_aggregation']},
  {v:'Customer Success and Support',g:'Onboarding',n:'Onboarding task creation',f:'high',s:10,note:'Task orchestration',caps:['onboarding_steps','task_creation','checklist_execution']},
  {v:'Customer Success and Support',g:'Onboarding',n:'Customer kickoff scheduling',f:'high',s:10,note:'Calendar flow',caps:['form_intake','task_creation','email_notification']},
  {v:'Customer Success and Support',g:'Adoption',n:'Adoption milestone tracking',f:'weekly',s:8,note:'Monitoring',caps:['usage_tracking','health_check','kpi_aggregation']},
  {v:'Customer Success and Support',g:'Adoption',n:'Usage anomaly alerts',f:'daily',s:9,note:'Monitoring',caps:['anomaly_detection','usage_tracking','alert_broadcast']},
  {v:'Customer Success and Support',g:'Renewals',n:'QBR preparation',f:'weekly',s:8,note:'LLM assisted',caps:['llm_summarization','executive_summary','research_synthesis']},
  {v:'Customer Success and Support',g:'Renewals',n:'Renewal follow-up reminders',f:'high',s:10,note:'Notification',caps:['reminder_dispatch','email_notification','follow_up_creation']},
  {v:'Customer Success and Support',g:'Expansion',n:'Expansion opportunity flagging',f:'weekly',s:8,note:'Signal based',caps:['anomaly_detection','task_creation']},
  {v:'Customer Success and Support',g:'Knowledge',n:'Knowledge base article suggestions',f:'weekly',s:7,note:'LLM assisted',caps:['knowledge_base_mgmt','content_generation','llm_summarization']},
  {v:'Customer Success and Support',g:'Knowledge',n:'FAQ response automation',f:'high',s:9,note:'Self-serve',caps:['qa_automation','text_classification','knowledge_base_mgmt']},
  {v:'Customer Success and Support',g:'Reporting',n:'Escalation summary generation',f:'high',s:8,note:'LLM summary',caps:['executive_summary','llm_summarization']},
  {v:'Customer Success and Support',g:'Reporting',n:'Voice-of-customer reporting',f:'weekly',s:8,note:'Analytics',caps:['kpi_aggregation','sentiment_scoring','trend_analysis']},
  // Finance and Accounting
  {v:'Finance and Accounting',g:'AR/AP',n:'Invoice generation',f:'high',s:10,note:'Template + data',caps:['invoice_generation','document_generation']},
  {v:'Finance and Accounting',g:'AR/AP',n:'Invoice approval',f:'high',s:9,note:'Approval chain',caps:['approval_chain','human_handoff']},
  {v:'Finance and Accounting',g:'AR/AP',n:'Accounts receivable aging',f:'daily',s:9,note:'Monitoring',caps:['health_check','kpi_aggregation','threshold_alerting']},
  {v:'Finance and Accounting',g:'AR/AP',n:'Dunning notices',f:'high',s:10,note:'Notification',caps:['email_notification','sms_notification','reminder_dispatch']},
  {v:'Finance and Accounting',g:'AR/AP',n:'Payment matching',f:'high',s:10,note:'Reconciliation',caps:['system_reconciliation','data_warehouse_sync']},
  {v:'Finance and Accounting',g:'AR/AP',n:'Bank reconciliation',f:'daily',s:10,note:'Automation',caps:['system_reconciliation','data_warehouse_sync','anomaly_detection']},
  {v:'Finance and Accounting',g:'Cash',n:'Cash application',f:'high',s:10,note:'Matching',caps:['system_reconciliation','data_warehouse_sync']},
  {v:'Finance and Accounting',g:'Refunds',n:'Refund approval',f:'medium',s:9,note:'Approval',caps:['approval_chain','human_handoff']},
  {v:'Finance and Accounting',g:'Expenses',n:'Expense reimbursement',f:'high',s:10,note:'Workflow',caps:['form_intake','approval_chain','task_creation']},
  {v:'Finance and Accounting',g:'Procurement',n:'Purchase order approval',f:'high',s:9,note:'Approval chain',caps:['approval_chain','human_handoff']},
  {v:'Finance and Accounting',g:'Procurement',n:'Vendor bill capture',f:'high',s:10,note:'OCR + intake',caps:['ocr_processing','form_intake','data_append']},
  {v:'Finance and Accounting',g:'Procurement',n:'Vendor bill coding',f:'high',s:9,note:'Classification',caps:['text_classification','data_validation']},
  {v:'Finance and Accounting',g:'Journal Entries',n:'Journal entry approval',f:'high',s:9,note:'Human approval',caps:['approval_chain','human_handoff']},
  {v:'Finance and Accounting',g:'Close',n:'Month-end close task tracking',f:'monthly',s:10,note:'Checklist',caps:['checklist_execution','task_creation']},
  {v:'Finance and Accounting',g:'Close',n:'Revenue recognition support',f:'monthly',s:8,note:'Assisted',caps:['kpi_aggregation','crm_sync']},
  {v:'Finance and Accounting',g:'Tax',n:'Tax document collection',f:'monthly',s:10,note:'Collection',caps:['task_creation','email_notification','document_generation']},
  {v:'Finance and Accounting',g:'Collections',n:'Collections queue prioritization',f:'daily',s:8,note:'Prioritization',caps:['priority_scoring','queue_assignment']},
  {v:'Finance and Accounting',g:'Reporting',n:'Budget variance reporting',f:'weekly',s:8,note:'Analytics',caps:['kpi_aggregation','trend_analysis','dashboard_refresh']},
  {v:'Finance and Accounting',g:'Reporting',n:'Spend anomaly detection',f:'daily',s:9,note:'Monitoring',caps:['anomaly_detection','threshold_alerting','audit_logging']},
  {v:'Finance and Accounting',g:'Reporting',n:'Financial close checklist',f:'monthly',s:10,note:'Checklist',caps:['checklist_execution','task_creation']},
  // People and HR
  {v:'People and HR',g:'Talent',n:'Candidate sourcing',f:'weekly',s:8,note:'Sourcing',caps:['llm_enrichment','research_synthesis']},
  {v:'People and HR',g:'Talent',n:'Resume screening',f:'high',s:9,note:'Classification',caps:['text_classification','llm_summarization','priority_scoring']},
  {v:'People and HR',g:'Talent',n:'Interview scheduling',f:'high',s:10,note:'Calendar automation',caps:['task_creation','email_notification']},
  {v:'People and HR',g:'Talent',n:'Candidate status updates',f:'high',s:10,note:'Notification',caps:['email_notification','crm_sync']},
  {v:'People and HR',g:'Talent',n:'Offer letter generation',f:'medium',s:9,note:'Template based',caps:['document_generation','proposal_creation']},
  {v:'People and HR',g:'Talent',n:'Background check routing',f:'medium',s:8,note:'External workflow',caps:['rule_based_routing','queue_assignment']},
  {v:'People and HR',g:'Onboarding',n:'Employee onboarding',f:'high',s:10,note:'Workflow',caps:['onboarding_steps','task_creation','checklist_execution']},
  {v:'People and HR',g:'Onboarding',n:'New-hire provisioning',f:'high',s:10,note:'IT handoff',caps:['task_creation','queue_assignment']},
  {v:'People and HR',g:'Onboarding',n:'Manager assignment',f:'high',s:9,note:'Routing',caps:['owner_assignment','rule_based_routing']},
  {v:'People and HR',g:'Offboarding',n:'Offboarding',f:'high',s:10,note:'Workflow',caps:['checklist_execution','task_creation']},
  {v:'People and HR',g:'Offboarding',n:'Access revocation',f:'high',s:10,note:'Security critical',caps:['task_creation','human_handoff']},
  {v:'People and HR',g:'Offboarding',n:'Device return tracking',f:'high',s:9,note:'Asset workflow',caps:['task_creation','usage_tracking']},
  {v:'People and HR',g:'Payroll',n:'Payroll input validation',f:'monthly',s:9,note:'QA',caps:['data_validation','health_check']},
  {v:'People and HR',g:'Benefits',n:'Benefits enrollment',f:'seasonal',s:10,note:'Workflow',caps:['form_intake','task_creation','crm_sync']},
  {v:'People and HR',g:'Operations',n:'PTO request routing',f:'high',s:10,note:'Approval',caps:['form_intake','approval_chain']},
  {v:'People and HR',g:'Operations',n:'Policy acknowledgement tracking',f:'high',s:10,note:'Compliance',caps:['task_creation','audit_logging']},
  {v:'People and HR',g:'Learning',n:'Training assignment',f:'weekly',s:10,note:'LMS workflow',caps:['task_creation','email_notification']},
  {v:'People and HR',g:'Performance',n:'Performance review reminders',f:'quarterly',s:10,note:'Notification',caps:['reminder_dispatch','email_notification']},
  {v:'People and HR',g:'Performance',n:'Promotion approval workflow',f:'quarterly',s:9,note:'Approval',caps:['approval_chain','human_handoff']},
  {v:'People and HR',g:'Engagement',n:'Employee engagement survey handling',f:'quarterly',s:10,note:'Survey workflow',caps:['form_intake','kpi_aggregation','executive_summary']},
  // Operations and Procurement
  {v:'Operations and Procurement',g:'Procurement',n:'Purchase request intake',f:'high',s:10,note:'Intake',caps:['form_intake','data_validation']},
  {v:'Operations and Procurement',g:'Procurement',n:'PO creation',f:'high',s:10,note:'Document creation',caps:['document_generation','invoice_generation']},
  {v:'Operations and Procurement',g:'Procurement',n:'Supplier onboarding',f:'medium',s:9,note:'Workflow',caps:['onboarding_steps','checklist_execution']},
  {v:'Operations and Procurement',g:'Procurement',n:'Supplier risk review',f:'medium',s:8,note:'Risk gate',caps:['risk_scoring','approval_chain']},
  {v:'Operations and Procurement',g:'Inventory',n:'Inventory reorder alerting',f:'daily',s:10,note:'Monitoring',caps:['threshold_alerting','health_check','alert_broadcast']},
  {v:'Operations and Procurement',g:'Inventory',n:'Demand forecast refresh',f:'weekly',s:8,note:'Analytics',caps:['trend_analysis','forecast_reporting','kpi_aggregation']},
  {v:'Operations and Procurement',g:'Logistics',n:'Shipment exception handling',f:'daily',s:10,note:'Exception workflow',caps:['anomaly_detection','escalation_routing','human_handoff']},
  {v:'Operations and Procurement',g:'Logistics',n:'Returns processing',f:'high',s:10,note:'Workflow',caps:['form_intake','task_creation','crm_sync']},
  {v:'Operations and Procurement',g:'Warehouse',n:'Warehouse task assignment',f:'high',s:10,note:'Tasking',caps:['task_creation','queue_assignment','owner_assignment']},
  {v:'Operations and Procurement',g:'Quality',n:'Quality inspection routing',f:'high',s:9,note:'Routing',caps:['rule_based_routing','queue_assignment']},
  {v:'Operations and Procurement',g:'Maintenance',n:'Maintenance work-order creation',f:'high',s:10,note:'CMMS workflow',caps:['task_creation','form_intake']},
  {v:'Operations and Procurement',g:'Maintenance',n:'Spare-part ordering',f:'high',s:9,note:'Procurement',caps:['task_creation','crm_sync']},
  {v:'Operations and Procurement',g:'Delivery',n:'Delivery status notifications',f:'high',s:10,note:'Notification',caps:['email_notification','sms_notification','reminder_dispatch']},
  {v:'Operations and Procurement',g:'Ops',n:'SLA monitoring',f:'daily',s:9,note:'Monitoring',caps:['sla_monitoring','threshold_alerting','health_check']},
  {v:'Operations and Procurement',g:'Ops',n:'Operations dashboard refresh',f:'daily',s:10,note:'Analytics',caps:['kpi_aggregation','dashboard_refresh']},
  // IT and Security
  {v:'IT and Security',g:'Access',n:'Access request approval',f:'high',s:10,note:'Approval gate',caps:['approval_chain','human_handoff']},
  {v:'IT and Security',g:'Access',n:'Role-based access review',f:'monthly',s:10,note:'Compliance',caps:['audit_logging','health_check','checklist_execution']},
  {v:'IT and Security',g:'Access',n:'Password reset routing',f:'high',s:10,note:'Self-service or helpdesk',caps:['form_intake','rule_based_routing']},
  {v:'IT and Security',g:'Devices',n:'Device enrollment',f:'high',s:10,note:'Provisioning',caps:['task_creation','onboarding_steps']},
  {v:'IT and Security',g:'Software',n:'Software license assignment',f:'high',s:10,note:'Provisioning',caps:['task_creation','crm_sync']},
  {v:'IT and Security',g:'Incidents',n:'Incident ticket creation',f:'high',s:10,note:'Intake',caps:['ticket_creation','form_intake']},
  {v:'IT and Security',g:'Incidents',n:'Incident escalation',f:'high',s:10,note:'Escalation',caps:['escalation_routing','human_handoff','alert_broadcast']},
  {v:'IT and Security',g:'Incidents',n:'On-call notification',f:'high',s:10,note:'Pager workflow',caps:['alert_broadcast','email_notification','sms_notification']},
  {v:'IT and Security',g:'Change',n:'Change request approval',f:'medium',s:9,note:'Approval',caps:['approval_chain','human_handoff']},
  {v:'IT and Security',g:'Change',n:'Release checklist execution',f:'high',s:10,note:'Checklist',caps:['checklist_execution','task_creation']},
  {v:'IT and Security',g:'Change',n:'CI/CD build notification',f:'high',s:10,note:'Notification',caps:['email_notification','alert_broadcast']},
  {v:'IT and Security',g:'Change',n:'Deployment rollback trigger',f:'high',s:10,note:'Automation',caps:['task_creation','alert_broadcast']},
  {v:'IT and Security',g:'Security',n:'Security alert triage',f:'high',s:10,note:'Triage',caps:['priority_scoring','rule_based_routing','escalation_routing']},
  {v:'IT and Security',g:'Security',n:'MFA reset workflow',f:'high',s:10,note:'Security critical',caps:['form_intake','task_creation','human_handoff']},
  {v:'IT and Security',g:'Security',n:'Audit log review',f:'weekly',s:9,note:'Compliance',caps:['audit_logging','anomaly_detection','health_check']},
  // Data and Analytics
  {v:'Data and Analytics',g:'Data Ops',n:'ETL failure alerting',f:'daily',s:10,note:'Monitoring',caps:['anomaly_detection','threshold_alerting','alert_broadcast']},
  {v:'Data and Analytics',g:'Data Ops',n:'Data pipeline retry',f:'daily',s:9,note:'Automation',caps:['health_check','task_creation','alert_broadcast']},
  {v:'Data and Analytics',g:'Data Ops',n:'Data quality checks',f:'daily',s:10,note:'Validation',caps:['data_validation','health_check','audit_logging']},
  {v:'Data and Analytics',g:'Data Ops',n:'Duplicate record detection',f:'daily',s:9,note:'Data hygiene',caps:['data_deduplication','health_check','master_data_management']},
  {v:'Data and Analytics',g:'Data Ops',n:'Master data sync',f:'daily',s:10,note:'Sync',caps:['master_data_management','data_warehouse_sync','crm_sync']},
  {v:'Data and Analytics',g:'BI',n:'KPI dashboard refresh',f:'daily',s:10,note:'Dashboard',caps:['kpi_aggregation','dashboard_refresh']},
  {v:'Data and Analytics',g:'BI',n:'Weekly executive summary',f:'weekly',s:8,note:'LLM summary',caps:['executive_summary','llm_summarization','kpi_aggregation']},
  {v:'Data and Analytics',g:'AI Ops',n:'Anomaly detection alerts',f:'daily',s:9,note:'Monitoring',caps:['anomaly_detection','threshold_alerting','alert_broadcast']},
  {v:'Data and Analytics',g:'Reporting',n:'Report distribution',f:'weekly',s:10,note:'Notification',caps:['email_notification','task_creation']},
  {v:'Data and Analytics',g:'Governance',n:'Data access request handling',f:'medium',s:10,note:'Approval',caps:['form_intake','approval_chain','human_handoff']},
  // Legal, Compliance, and Risk
  {v:'Legal, Compliance, and Risk',g:'Contracts',n:'Contract intake',f:'high',s:10,note:'Intake',caps:['form_intake','document_generation']},
  {v:'Legal, Compliance, and Risk',g:'Contracts',n:'Contract classification',f:'high',s:9,note:'Routing',caps:['text_classification','rule_based_routing']},
  {v:'Legal, Compliance, and Risk',g:'Contracts',n:'NDA generation',f:'high',s:10,note:'Template',caps:['document_generation','contract_drafting']},
  {v:'Legal, Compliance, and Risk',g:'Contracts',n:'Clause review routing',f:'medium',s:9,note:'Review',caps:['queue_assignment','rule_based_routing']},
  {v:'Legal, Compliance, and Risk',g:'Contracts',n:'Approval chain management',f:'medium',s:10,note:'Workflow',caps:['approval_chain','escalation_routing']},
  {v:'Legal, Compliance, and Risk',g:'Audit',n:'Audit evidence collection',f:'medium',s:10,note:'Collection',caps:['task_creation','data_append','document_generation']},
  {v:'Legal, Compliance, and Risk',g:'Policy',n:'Policy review reminders',f:'weekly',s:10,note:'Notification',caps:['reminder_dispatch','email_notification']},
  {v:'Legal, Compliance, and Risk',g:'Licensing',n:'License renewal tracking',f:'weekly',s:10,note:'Tracking',caps:['usage_tracking','reminder_dispatch','health_check']},
  {v:'Legal, Compliance, and Risk',g:'Incidents',n:'Incident documentation',f:'high',s:10,note:'Documentation',caps:['form_intake','document_generation','audit_logging']},
  {v:'Legal, Compliance, and Risk',g:'Questionnaires',n:'Compliance questionnaire routing',f:'medium',s:9,note:'Routing',caps:['rule_based_routing','queue_assignment']},
  {v:'Legal, Compliance, and Risk',g:'Risk',n:'Risk register updates',f:'weekly',s:8,note:'Record keeping',caps:['data_validation','crm_sync','master_data_management']},
  {v:'Legal, Compliance, and Risk',g:'Vendor',n:'Vendor compliance checks',f:'medium',s:9,note:'Review',caps:['health_check','risk_scoring','checklist_execution']},
  {v:'Legal, Compliance, and Risk',g:'Litigation',n:'Litigation hold notices',f:'high',s:10,note:'Legal sensitive',caps:['email_notification','task_creation','human_handoff']},
  {v:'Legal, Compliance, and Risk',g:'Records',n:'Records retention workflow',f:'weekly',s:10,note:'Policy driven',caps:['task_creation','audit_logging','master_data_management']},
  // Healthcare
  {v:'Healthcare',g:'Clinical Ops',n:'Appointment scheduling',f:'high',s:10,note:'Calendar workflow',caps:['form_intake','task_creation','crm_sync']},
  {v:'Healthcare',g:'Clinical Ops',n:'Patient reminders',f:'high',s:10,note:'Notification',caps:['email_notification','sms_notification','reminder_dispatch']},
  {v:'Healthcare',g:'Clinical Ops',n:'Intake form validation',f:'high',s:10,note:'Validation',caps:['form_intake','data_validation']},
  {v:'Healthcare',g:'Clinical Ops',n:'Referral routing',f:'high',s:9,note:'Routing',caps:['rule_based_routing','queue_assignment']},
  {v:'Healthcare',g:'Clinical Ops',n:'Prior authorization',f:'medium',s:9,note:'Approval',caps:['approval_chain','human_handoff']},
  {v:'Healthcare',g:'Clinical Ops',n:'Claims submission',f:'high',s:10,note:'Submission',caps:['document_generation','crm_sync','data_validation']},
  {v:'Healthcare',g:'Clinical Ops',n:'Claim denial management',f:'high',s:9,note:'Exception handling',caps:['anomaly_detection','task_creation','human_handoff']},
  {v:'Healthcare',g:'Clinical Ops',n:'Appeal drafting',f:'medium',s:8,note:'LLM assisted',caps:['llm_summarization','content_generation','document_generation']},
  {v:'Healthcare',g:'Clinical Ops',n:'Medical coding support',f:'high',s:9,note:'Assisted coding',caps:['text_classification','llm_enrichment']},
  {v:'Healthcare',g:'Clinical Ops',n:'Billing reconciliation',f:'daily',s:10,note:'Reconciliation',caps:['system_reconciliation','data_warehouse_sync','anomaly_detection']},
  {v:'Healthcare',g:'Clinical Ops',n:'Lab result routing',f:'high',s:10,note:'Routing',caps:['rule_based_routing','queue_assignment','alert_broadcast']},
  {v:'Healthcare',g:'Clinical Ops',n:'Care-gap outreach',f:'weekly',s:9,note:'Outreach',caps:['email_notification','task_creation','health_check']},
  {v:'Healthcare',g:'Clinical Ops',n:'No-show follow-up',f:'high',s:10,note:'Notification',caps:['reminder_dispatch','email_notification','task_creation']},
  {v:'Healthcare',g:'Clinical Ops',n:'Clinical documentation support',f:'high',s:8,note:'LLM assisted',caps:['llm_summarization','content_generation','document_generation']},
  {v:'Healthcare',g:'Triage',n:'Triage intake',f:'high',s:10,note:'Intake',caps:['form_intake','priority_scoring','queue_assignment']},
  {v:'Healthcare',g:'Triage',n:'Medication refill routing',f:'high',s:10,note:'Routing',caps:['form_intake','rule_based_routing','task_creation']},
  // Manufacturing, Retail, and Logistics
  {v:'Manufacturing, Retail, and Logistics',g:'Production',n:'Production schedule updates',f:'daily',s:10,note:'Scheduling',caps:['task_creation','crm_sync']},
  {v:'Manufacturing, Retail, and Logistics',g:'Production',n:'Quality defect escalation',f:'high',s:10,note:'Escalation',caps:['anomaly_detection','escalation_routing','human_handoff']},
  {v:'Manufacturing, Retail, and Logistics',g:'Production',n:'Predictive maintenance trigger',f:'daily',s:9,note:'Monitoring',caps:['health_check','anomaly_detection','threshold_alerting']},
  {v:'Manufacturing, Retail, and Logistics',g:'Supply Chain',n:'Materials shortage alerting',f:'daily',s:10,note:'Monitoring',caps:['threshold_alerting','health_check','alert_broadcast']},
  {v:'Manufacturing, Retail, and Logistics',g:'Supply Chain',n:'Supplier delay escalation',f:'daily',s:10,note:'Escalation',caps:['escalation_routing','human_handoff','alert_broadcast']},
  {v:'Manufacturing, Retail, and Logistics',g:'Inventory',n:'Inventory replenishment',f:'daily',s:10,note:'Reorder',caps:['threshold_alerting','task_creation','crm_sync']},
  {v:'Manufacturing, Retail, and Logistics',g:'Inventory',n:'Purchase order generation',f:'high',s:10,note:'Creation',caps:['document_generation','invoice_generation']},
  {v:'Manufacturing, Retail, and Logistics',g:'Logistics',n:'Shipment tracking',f:'high',s:10,note:'Tracking',caps:['usage_tracking','health_check','crm_sync']},
  {v:'Manufacturing, Retail, and Logistics',g:'Logistics',n:'Order exception handling',f:'high',s:10,note:'Exception workflow',caps:['anomaly_detection','escalation_routing','human_handoff']},
  {v:'Manufacturing, Retail, and Logistics',g:'Returns',n:'Product return routing',f:'high',s:10,note:'Routing',caps:['form_intake','rule_based_routing','task_creation']},
  {v:'Manufacturing, Retail, and Logistics',g:'Pricing',n:'Price update sync',f:'high',s:10,note:'Sync',caps:['crm_sync','data_warehouse_sync','master_data_management']},
  {v:'Manufacturing, Retail, and Logistics',g:'Inventory',n:'Stockout alerting',f:'daily',s:10,note:'Alerting',caps:['threshold_alerting','health_check','alert_broadcast']},
  {v:'Manufacturing, Retail, and Logistics',g:'Forecasting',n:'Demand sensing refresh',f:'daily',s:8,note:'Analytics',caps:['trend_analysis','forecast_reporting','kpi_aggregation']},
  {v:'Manufacturing, Retail, and Logistics',g:'Fulfillment',n:'Fulfillment priority routing',f:'high',s:10,note:'Routing',caps:['priority_scoring','rule_based_routing','queue_assignment']},
  {v:'Manufacturing, Retail, and Logistics',g:'Fulfillment',n:'Last-mile exception resolution',f:'high',s:10,note:'Exception handling',caps:['anomaly_detection','escalation_routing','human_handoff']},
  // Research, Content, and Knowledge Work
  {v:'Research, Content, and Knowledge Work',g:'Research',n:'Research topic discovery',f:'weekly',s:8,note:'LLM assisted',caps:['research_synthesis','llm_enrichment']},
  {v:'Research, Content, and Knowledge Work',g:'Research',n:'Source collection',f:'weekly',s:8,note:'Aggregation',caps:['llm_enrichment','research_synthesis']},
  {v:'Research, Content, and Knowledge Work',g:'Research',n:'Source tagging',f:'weekly',s:8,note:'Classification',caps:['text_classification','data_append']},
  {v:'Research, Content, and Knowledge Work',g:'Research',n:'Source summarization',f:'weekly',s:8,note:'LLM assisted',caps:['llm_summarization','research_synthesis']},
  {v:'Research, Content, and Knowledge Work',g:'Research',n:'Annotated bibliography updates',f:'weekly',s:7,note:'LLM assisted',caps:['llm_summarization','knowledge_base_mgmt']},
  {v:'Research, Content, and Knowledge Work',g:'Research',n:'Literature review maintenance',f:'weekly',s:7,note:'LLM assisted',caps:['llm_summarization','research_synthesis','knowledge_base_mgmt']},
  {v:'Research, Content, and Knowledge Work',g:'Research',n:'Research note organization',f:'weekly',s:8,note:'Knowledge mgmt',caps:['knowledge_base_mgmt','text_classification']},
  {v:'Research, Content, and Knowledge Work',g:'Sales Enablement',n:'Prospect research briefs',f:'weekly',s:7,note:'LLM assisted',caps:['research_synthesis','llm_summarization','content_generation']},
  {v:'Research, Content, and Knowledge Work',g:'Research',n:'Competitor landscape scans',f:'weekly',s:8,note:'Monitoring',caps:['research_synthesis','health_check','kpi_aggregation']},
  {v:'Research, Content, and Knowledge Work',g:'Research',n:'Weekly market monitoring',f:'weekly',s:8,note:'Monitoring',caps:['health_check','kpi_aggregation','research_synthesis']},
  {v:'Research, Content, and Knowledge Work',g:'Documents',n:'Document extraction and OCR',f:'high',s:10,note:'Document AI',caps:['ocr_processing','data_append','text_classification']},
  {v:'Research, Content, and Knowledge Work',g:'Meetings',n:'Meeting transcript summarization',f:'high',s:9,note:'LLM assisted',caps:['llm_summarization','data_append']},
  {v:'Research, Content, and Knowledge Work',g:'Meetings',n:'Action-item extraction',f:'high',s:10,note:'LLM assisted',caps:['llm_summarization','task_creation','data_append']},
  {v:'Research, Content, and Knowledge Work',g:'Knowledge',n:'Knowledge base drafting',f:'weekly',s:8,note:'LLM assisted',caps:['knowledge_base_mgmt','content_generation','llm_summarization']},
  {v:'Research, Content, and Knowledge Work',g:'Knowledge',n:'Internal wiki updates',f:'weekly',s:8,note:'LLM assisted',caps:['knowledge_base_mgmt','content_generation','llm_summarization']},
];

// ============================================================
// 3. HELPERS
// ============================================================
function slugify(text) {
  return text.toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .substring(0, 100);
}

async function main() {
  console.log('=== SEED WORKFLOW SYSTEM ===\n');

  // ---- 3a. Create primitive agent_types ----
  console.log('=== CREATING AGENT PRIMITIVES ===');
  let createdPrimitives = 0;
  for (const p of PRIMITIVES) {
    // Check if exists
    const existing = await pool.query('SELECT id FROM agent_types WHERE key = $1', [p.key]);
    if (existing.rows.length === 0) {
      await pool.query(`
        INSERT INTO agent_types (key, name, description, category, capabilities, runtime_type, is_active)
        VALUES ($1, $2, $3, 'primitive', $4, $5, true)
      `, [p.key, p.name, p.description, p.capabilities.join(', '), p.runtime_type]);
      createdPrimitives++;
      console.log(`  Created: ${p.key}`);
    } else {
      console.log(`  Exists: ${p.key}`);
    }
  }
  console.log(`  Created ${createdPrimitives} new primitives\n`);

  // ---- 3b. Add capabilities to agent_capabilities ----
  console.log('=== ADDING CAPABILITIES ===');
  let capCount = 0;
  for (const p of PRIMITIVES) {
    for (const capKey of p.capabilities) {
      const existing = await pool.query(
        'SELECT id FROM agent_capabilities WHERE capability_key = $1 AND agent_type_key = $2',
        [capKey, p.key]
      );
      if (existing.rows.length === 0) {
        await pool.query(`
          INSERT INTO agent_capabilities (capability_key, capability_name, agent_type_key, enabled, config)
          VALUES ($1, $2, $3, true, '{}')
        `, [capKey, capKey.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '), p.key]);
        capCount++;
      }
    }
  }
  console.log(`  Added ${capCount} capabilities\n`);

  // ---- 3c. Extend workflow_templates ----
  console.log('=== EXTENDING WORKFLOW_TEMPLATES ===');
  try {
    await pool.query('ALTER TABLE workflow_templates ADD COLUMN IF NOT EXISTS frequency text');
    await pool.query('ALTER TABLE workflow_templates ADD COLUMN IF NOT EXISTS automation_score integer');
    console.log('  Added frequency, automation_score columns\n');
  } catch(e) {
    console.log('  Columns may already exist:', e.message, '\n');
  }

  // ---- 3d. Insert workflows into workflow_templates ----
  console.log('=== INSERTING WORKFLOW CATALOG ===');
  let wfCount = 0;
  for (const w of WORKFLOWS) {
    const key = slugify(`${w.v}_${w.g}_${w.n}`);
    
    // Check if exists
    const existing = await pool.query('SELECT id FROM workflow_templates WHERE key = $1', [key]);
    if (existing.rows.length === 0) {
      // Build agent_assignments — which primitives handle this workflow
      const agentTypesNeeded = [];
      for (const cap of w.caps) {
        // Find which primitive has this capability
        for (const p of PRIMITIVES) {
          if (p.capabilities.includes(cap)) {
            if (!agentTypesNeeded.includes(p.key)) {
              agentTypesNeeded.push(p.key);
            }
            break;
          }
        }
      }

      await pool.query(`
        INSERT INTO workflow_templates (key, name, description, vertical_key, workflow_type, tier, frequency, automation_score, agent_assignments, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, true)
      `, [
        key,
        w.n,
        w.note || `${w.n} workflow in ${w.v}`,
        slugify(w.v),
        w.g,  // workflow_type = workflow_group
        w.f,  // tier = frequency
        w.f,  // frequency
        w.s,  // automation_score
        JSON.stringify({
          required_primitives: agentTypesNeeded,
          required_capabilities: w.caps,
          vertical: w.v,
          group: w.g,
        }),
      ]);
      wfCount++;
    }
  }
  console.log(`  Inserted ${wfCount} new workflows\n`);

  // ---- 3e. Connect agents to workflows ----
  console.log('=== CONNECTING AGENTS TO WORKFLOWS ===');
  const agents = await pool.query('SELECT id, agent_id, agent_name, role_type, vertical, agent_type FROM agents ORDER BY agent_id');
  
  // Map each agent to relevant workflows based on vertical + role
  let agentWfCount = 0;
  
  for (const agent of agents.rows) {
    // Find workflows matching this agent's vertical
    const vertSlug = slugify(agent.vertical || '');
    const matchingWorkflows = await pool.query(`
      SELECT id, key, name, agent_assignments FROM workflow_templates 
      WHERE vertical_key = $1 AND is_active = true
    `, [vertSlug]);
    
    // Also check agent's agent_type for relevant capability workflows
    // e.g., a lead_sales agent should get sales workflows
    const typeWorkflows = await pool.query(`
      SELECT id, key, name, agent_assignments FROM workflow_templates 
      WHERE agent_assignments->>'vertical' LIKE '%${agent.agent_type}%' 
        OR agent_assignments->>'group' LIKE '%${agent.role_type}%'
      LIMIT 5
    `);
    
    // Get the general platform workflows too (core vertical)
    const coreWorkflows = await pool.query(`
      SELECT id, key, name FROM workflow_templates 
      WHERE vertical_key = 'revenue_and_sales' OR vertical_key = 'customer_success_and_support'
      ORDER BY random() LIMIT 3
    `);

    // Insert agent_workflows connections
    for (const wf of [...matchingWorkflows.rows, ...typeWorkflows.rows, ...coreWorkflows.rows]) {
      // Check if connection exists
      const exists = await pool.query(
        'SELECT id FROM agent_workflows WHERE agent_id = $1 AND workflow_id = $2',
        [agent.id, wf.key]
      );
      if (exists.rows.length === 0) {
        await pool.query(`
          INSERT INTO agent_workflows (slug, workflow_id, workflow_name, trigger_type, is_active, agent_id)
          VALUES ($1, $2, $3, 'event', true, $4)
        `, [
          `${agent.agent_id}_${wf.key}`,
          wf.key,
          wf.name,
          agent.id,
        ]);
        agentWfCount++;
      }
    }
  }
  console.log(`  Connected ${agentWfCount} agent-workflow pairs\n`);

  // ---- 3f. Summary ----
  console.log('=== SUMMARY ===');
  const primCount = await pool.query("SELECT COUNT(*) FROM agent_types WHERE category = 'primitive'");
  const capCount2 = await pool.query("SELECT COUNT(*) FROM agent_capabilities WHERE agent_type_key IN (SELECT key FROM agent_types WHERE category = 'primitive')");
  const wfCount2 = await pool.query('SELECT COUNT(*) FROM workflow_templates');
  const awfCount = await pool.query('SELECT COUNT(*) FROM agent_workflows');
  const vertDist = await pool.query('SELECT vertical_key, COUNT(*) as count FROM workflow_templates GROUP BY vertical_key ORDER BY COUNT(*) DESC');
  
  console.log(`  Agent primitives: ${primCount.rows[0].count}`);
  console.log(`  Capabilities: ${capCount2.rows[0].count}`);
  console.log(`  Workflow templates: ${wfCount2.rows[0].count}`);
  console.log(`  Agent-workflow links: ${awfCount.rows[0].count}`);
  console.log('\n  Workflow distribution by vertical:');
  for (const row of vertDist.rows) {
    console.log(`    ${row.vertical_key}: ${row.count}`);
  }

  await pool.end();
  console.log('\nDone!');
}

main().catch(err => {
  console.error('FATAL:', err);
  process.exit(1);
});
