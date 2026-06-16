/**
 * Continuation script for phases 5 and 7
 * Optimized with batch operations
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

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').substring(0, 100);
}

async function main() {
  console.log('=== PHASE 5 CONTINUED: OPTIMIZED AGENT-WORKFLOW CONNECTIONS ===\n');

  // 1. Load all agents
  const agents = await pool.query(`SELECT id, agent_id, agent_name, role_type, vertical, agent_type FROM agents ORDER BY agent_id`);
  const wfTemplates = await pool.query(`SELECT id, key, name, vertical_key, agent_assignments FROM workflow_templates WHERE is_active = true`);
  console.log(`Agents: ${agents.rows.length}, Workflow templates: ${wfTemplates.rows.length}`);

  // 2. Load existing connections into a Set for fast lookup
  const existingLinks = await pool.query('SELECT agent_id, workflow_id FROM agent_workflows');
  const linkSet = new Set(existingLinks.rows.map(r => `${r.agent_id}::${r.workflow_id}`));
  console.log(`Existing links: ${linkSet.size}`);

  // 3. Build workflow lookup by vertical
  const vertMap = {};
  for (const wf of wfTemplates.rows) {
    const vk = wf.vertical_key;
    if (!vertMap[vk]) vertMap[vk] = [];
    vertMap[vk].push(wf);
  }

  const platformVertKeys = ['revenue_and_sales', 'customer_success_and_support'];

  const typeToGroups = {
    lead_sales: ['Lead Management','Sales Ops','Pipeline','Deal Desk','Contracts','Renewals','Reporting','Call Intelligence','Forecasting','Expansion'],
    orchestration_agent: ['Ops','Scheduling','Monitoring','Reporting','Change','Incidents'],
    intake_consultation: ['Intake','Screening','Triage','Clinical Ops','Support','Onboarding'],
    concierge_booking: ['Booking','Scheduling','Guest Experience','Concierge','Events'],
    enterprise_infrastructure: ['Access','Devices','Incidents','Change','Security','Data Ops','BI','Compliance'],
    bridge_agent: ['Routing','Escalation','Handoff','Sync','Approval Chain'],
    batch_compute_agent: ['Automation','Scheduling','Task','Maintenance'],
    intelligence_agent: ['Analytics','Intelligence','Forecasting','Reporting','Research'],
    creator_commerce: ['Content','Campaigns','Social','Commerce','Media'],
    analytics_agent: ['Analytics','BI','Reporting','Forecasting','Data Ops'],
    integration_agent: ['Sync','Data Ops','Compliance','Audit'],
    onboarding_agent: ['Onboarding','Provisioning','Training','Benefits'],
    forecasting_agent: ['Forecasting','Analytics','Demand','Pipeline'],
  };

  // 4. Generate all new connections in memory
  const toInsert = [];
  for (const agent of agents.rows) {
    const agentVertSlug = slugify(agent.vertical || '');
    const matchedWfs = new Set();

    // Match by vertical
    if (vertMap[agentVertSlug]) {
      for (const wf of vertMap[agentVertSlug]) matchedWfs.add(wf);
    }

    // Match by agent_type to groups
    const groups = typeToGroups[agent.agent_type] || [];
    for (const wf of wfTemplates.rows) {
      const a = wf.agent_assignments;
      const wfGroup = (a && a.group) || '';
      const wfName = wf.name || '';
      if (groups.some(g => wfGroup.includes(g) || wfName.includes(g))) matchedWfs.add(wf);
    }

    // CORE/CRISIS get governance workflows
    if (['CORE','CRISIS','CROSS_SYSTEM'].includes(agent.role_type)) {
      for (const wf of wfTemplates.rows) {
        const a = wf.agent_assignments;
        const wfGroup = (a && a.group) || '';
        if (wfGroup.includes('Monitoring') || wfGroup.includes('Compliance') || wfGroup.includes('Governance')) matchedWfs.add(wf);
      }
    }

    // Platform workflows
    for (const vk of platformVertKeys) {
      if (vertMap[vk] && agentVertSlug !== vk) {
        for (const pwf of vertMap[vk].slice(0, 3)) matchedWfs.add(pwf);
      }
    }

    // Check against existing links
    for (const wf of matchedWfs) {
      const linkKey = `${agent.id}::${wf.key}`;
      if (!linkSet.has(linkKey)) {
        toInsert.push({ agentId: agent.id, agentSlug: agent.agent_id, wfKey: wf.key, wfName: wf.name });
        linkSet.add(linkKey); // prevent duplicates within this batch
      }
    }
  }

  console.log(`New connections to create: ${toInsert.length}`);

  // 5. Add unique constraint for batch upsert support
  // Check agent_workflows unique constraints
  const constraints = await pool.query(`
    SELECT conname, pg_get_constraintdef(oid) 
    FROM pg_constraint 
    WHERE conrelid = 'agent_workflows'::regclass
  `);
  console.log('Current constraints on agent_workflows:', constraints.rows.length);
  for (const r of constraints.rows) {
    console.log(`  ${r.conname}: ${r.pg_get_constraintdef}`);
  }

  // Add unique constraint on (agent_id, workflow_id) for batch ON CONFLICT support
  const hasUnique = constraints.rows.some(r => r.conname === 'agent_workflows_agent_workflow_unique');
  if (!hasUnique) {
    try {
      await pool.query(`
        ALTER TABLE agent_workflows 
        ADD CONSTRAINT agent_workflows_agent_workflow_unique 
        UNIQUE (agent_id, workflow_id)
      `);
      console.log('Added unique constraint on (agent_id, workflow_id)');
    } catch(e) {
      console.log('Could not add unique constraint:', e.message);
    }
  } else {
    console.log('Unique constraint already exists');
  }
  if (toInsert.length > 0) {
    const BATCH = 500;
    let done = 0;
    for (let i = 0; i < toInsert.length; i += BATCH) {
      const batch = toInsert.slice(i, i + BATCH);
      const values = batch.map((_, j) => 
        `($${j*4+1}, $${j*4+2}, $${j*4+3}, 'event', true, $${j*4+4})`
      ).join(',');
      const params = [];
      for (const item of batch) {
        params.push(`${item.agentSlug}_${item.wfKey}`, item.wfKey, item.wfName, item.agentId);
      }
      try {
        await pool.query(`
          INSERT INTO agent_workflows (slug, workflow_id, workflow_name, trigger_type, is_active, agent_id)
          VALUES ${values}
          ON CONFLICT DO NOTHING
        `, params);
      } catch(e) {
        console.log(`  Batch error at ${i}: ${e.message}`);
      }
      done += batch.length;
      if (done % 2000 === 0 || done === toInsert.length) console.log(`  Progress: ${done}/${toInsert.length}`);
    }
  }

  // Verify
  const totalLinks = await pool.query('SELECT COUNT(*) as cnt FROM agent_workflows');
  console.log(`\nTotal agent-workflow links: ${totalLinks.rows[0].cnt}`);

  // ============================================================
  // PHASE 7: n8n WORKFLOW TEMPLATES
  // ============================================================
  console.log('\n=== PHASE 7: n8n WORKFLOW TEMPLATES ===\n');

  const N8N_TEMPLATES = [
    { key: 'n8n_intake_workflow', name: 'n8n Intake Workflow', desc: 'Ingest form/webhook/ticket payloads, normalize, dedupe, hand off', caps: ['form_intake','ticket_creation','data_validation','webhook_receipt'], prims: ['intake_agent','sync_agent'] },
    { key: 'n8n_router_workflow', name: 'n8n Router Workflow', desc: 'Apply rules, scores, territory, or queue assignment', caps: ['rule_based_routing','queue_assignment','owner_assignment','round_robin'], prims: ['router_agent'] },
    { key: 'n8n_enrichment_workflow', name: 'n8n Enrichment Workflow', desc: 'Call external APIs/LLMs for data enrichment', caps: ['external_api_enrichment','llm_enrichment','research_brief'], prims: ['enrichment_agent','knowledge_agent'] },
    { key: 'n8n_scoring_workflow', name: 'n8n Scoring Workflow', desc: 'Calculate ICP, churn, priority, or qualification scores', caps: ['lead_scoring','churn_scoring','priority_scoring','risk_scoring'], prims: ['scoring_agent'] },
    { key: 'n8n_task_workflow', name: 'n8n Task Orchestration Workflow', desc: 'Create records, assign owners, set due dates, chain follow-ups', caps: ['task_creation','sequence_enrollment','checklist_execution','follow_up_creation'], prims: ['task_agent','notification_agent'] },
    { key: 'n8n_notification_workflow', name: 'n8n Notification Workflow', desc: 'Send email, Slack, SMS, or calendar reminders', caps: ['email_notification','slack_notification','sms_notification','reminder_dispatch'], prims: ['notification_agent'] },
    { key: 'n8n_approval_workflow', name: 'n8n Approval Workflow', desc: 'Manage wait states, human review, escalation chains', caps: ['approval_chain','human_handoff','escalation_routing'], prims: ['approval_agent','notification_agent'] },
    { key: 'n8n_monitoring_workflow', name: 'n8n Monitoring Workflow', desc: 'Watch SLAs, anomalies, failures, thresholds; trigger alerts', caps: ['anomaly_detection','sla_monitoring','threshold_alerting','health_check'], prims: ['monitoring_agent','notification_agent'] },
  ];

  console.log('Inserting n8n workflow templates...');
  let n8nCount = 0;
  for (const t of N8N_TEMPLATES) {
    const existing = await pool.query('SELECT id FROM workflow_templates WHERE key = $1', [t.key]);
    if (existing.rows.length === 0) {
      await pool.query(`
        INSERT INTO workflow_templates (key, name, description, vertical_key, workflow_type, tier, frequency, automation_score, agent_assignments, stages_json, is_active)
        VALUES ($1, $2, $3, $4, 'n8n_template', 'all', 'high', 10, $5::jsonb, '[]'::jsonb, true)
      `, [t.key, t.name, t.desc, 'core', JSON.stringify({ required_primitives: t.prims, required_capabilities: t.caps, is_n8n_template: true })]);
      n8nCount++;
    }
  }
  console.log(`Inserted ${n8nCount} n8n templates`);

  // ============================================================
  // FIX: Primitives count check
  // ============================================================
  console.log('\n=== VERIFICATION ===\n');
  const primCount = await pool.query("SELECT COUNT(*) as cnt FROM agent_types WHERE category = 'primitive'");
  console.log(`Primitives (category='primitive'): ${primCount.rows[0].cnt}`);
  
  // Check which agent_types have category null
  const nullCat = await pool.query("SELECT key, name FROM agent_types WHERE category IS NULL ORDER BY key");
  console.log(`Agent types with NULL category: ${nullCat.rows.length}`);
  for (const r of nullCat.rows) {
    console.log(`  ${r.key} (${r.name})`);
  }

  // Fix - update the 12 primitives to have category='primitive'
  const primKeys = ['intake_agent','router_agent','enrichment_agent','scoring_agent','task_agent','notification_agent','document_agent','sync_agent','monitoring_agent','approval_agent','analytics_agent','knowledge_agent'];
  for (const k of primKeys) {
    await pool.query("UPDATE agent_types SET category = 'primitive' WHERE key = $1 AND (category IS NULL OR category != 'primitive')", [k]);
  }
  const primFix = await pool.query("SELECT COUNT(*) as cnt FROM agent_types WHERE category = 'primitive'");
  console.log(`\nAfter fix - Primitives: ${primFix.rows[0].cnt}`);

  const finalLinks = await pool.query('SELECT COUNT(*) as cnt FROM agent_workflows');
  const finalWF = await pool.query('SELECT COUNT(*) as cnt FROM workflow_templates');
  const finalN8N = await pool.query("SELECT COUNT(*) as cnt FROM workflow_templates WHERE workflow_type='n8n_template'");
  console.log(`\nFinal counts:`);
  console.log(`  Workflow templates: ${finalWF.rows[0].cnt}`);
  console.log(`  Agent-workflow links: ${finalLinks.rows[0].cnt}`);
  console.log(`  n8n templates: ${finalN8N.rows[0].cnt}`);

  await pool.end();
  console.log('\nDone!');
}

main().catch(e => { console.error(e); process.exit(1); });
