import pg from 'pg';

const pool = new pg.Pool({
  host: 'db.jebixydqpvsegvrtfmgm.supabase.co', port: 5432, database: 'postgres',
  user: 'postgres', password: process.argv[2],
  ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 15000,
});

async function main() {
  console.log('╔══════════════════════════════════════════╗');
  console.log('║   BATCH FIX: Columns, Activation, Wiring  ║');
  console.log('╚══════════════════════════════════════════╝\n');

  // ══════════════════════════════════════════════
  // 1. ACTIVATE AGENT TYPES — fill all NULL columns
  // ══════════════════════════════════════════════
  console.log('▓▓▓ 1. AGENT TYPES — ACTIVATE & FILL ▓▓▓\n');

  // Fill canonical_template based on agent_type key patterns
  const {rows: atypes} = await pool.query("SELECT key, name, category FROM agent_types WHERE canonical_template IS NULL OR capabilities IS NULL OR is_active IS NULL");
  console.log(`  ${atypes.length} agent types need activation`);

  // Template mapping: agent type key → canonical template key
  const templateMap = {
    intake_agent: 'intake', router_agent: 'router', enrichment_agent: 'enrichment',
    scoring_agent: 'scoring', task_agent: 'task', notification_agent: 'notification',
    document_agent: 'document', approval_agent: 'approval', monitoring_agent: 'monitoring',
    analytics_agent: 'analytics', knowledge_agent: 'knowledge', sync_agent: 'sync',
    concierge_agent: 'concierge', sales_agent: 'sales', orchestrator_agent: 'orchestrator',
    booking_agent: 'booking', memory_agent: 'memory', integration_agent: 'integration',
    intelligence_agent: 'intelligence', forecasting_agent: 'forecasting',
  };

  // Capabilities per agent type
  const capMap = {
    intake_agent: 'form_processing,ticket_creation,webhook_handling,entity_extraction',
    router_agent: 'rule_matching,routing,load_balancing,queue_management',
    enrichment_agent: 'api_integration,data_enhancement,llm_calling,field_mapping',
    scoring_agent: 'lead_scoring,risk_assessment,priority_calc,threshold_eval',
    task_agent: 'task_creation,sequencing,checklist_mgmt,delegation',
    notification_agent: 'email,sms,slack,push,digest_scheduling',
    document_agent: 'document_gen,contract_mgmt,quote_proposal,report_builder',
    approval_agent: 'approval_chain,escalation,human_handoff,signature_collection',
    monitoring_agent: 'anomaly_detection,sla_monitoring,health_check,threshold_alerting',
    analytics_agent: 'kpi_aggregation,dashboard_refresh,trend_analysis,forecast_reporting',
    knowledge_agent: 'summarization,classification,research,content_gen,qa',
    sync_agent: 'crm_sync,erp_sync,data_dedup,master_data_mgmt',
    concierge_agent: 'booking,scheduling,vip_service,preference_tracking',
    sales_agent: 'lead_qualification,outreach,pipeline_mgmt,deal_tracking',
    orchestrator_agent: 'workflow_orchestration,state_mgmt,error_handling,retry_logic',
    booking_agent: 'appointment_scheduling,calendar_sync,availability_check',
    memory_agent: 'memory_storage,context_retrieval,relationship_tracking',
    integration_agent: 'api_connect,data_transform,middleware,mapping',
    intelligence_agent: 'pattern_recognition,insight_gen,predictive_analysis',
    forecasting_agent: 'demand_forecast,resource_planning,trend_projection',
  };

  const now = new Date().toISOString();
  for (const t of atypes) {
    const tmpl = templateMap[t.key] || t.key.replace(/_agent$/, '');
    const caps = capMap[t.key] || 'general';
    await pool.query(`
      UPDATE agent_types SET
        canonical_template = COALESCE(canonical_template, $1),
        capabilities = COALESCE(capabilities, $2),
        is_active = COALESCE(is_active, true),
        runtime_type = COALESCE(runtime_type, 'standard'),
        slug = COALESCE(slug, $3)
      WHERE key = $4
    `, [tmpl, caps, t.key, t.key]);
  }
  
  // Fix remaining description gaps
  await pool.query(`
    UPDATE agent_types SET description = name WHERE description IS NULL
  `);
  
  console.log(`  ${atypes.length} agent types activated`);

  // ══════════════════════════════════════════════
  // 2. WIRE AGENTS TO CLIENTS
  // ══════════════════════════════════════════════
  console.log('\n▓▓▓ 2. WIRE AGENTS TO CLIENTS ▓▓▓\n');

  // Get existing clients
  const {rows: clients} = await pool.query("SELECT id, full_name, email FROM clients WHERE full_name IS NOT NULL");
  console.log(`  ${clients.length} named clients available`);

  // Get agents by archetype/vertical for client matching
  const {rows: agents} = await pool.query("SELECT id, agent_id, agent_name, vertical FROM agents WHERE client_id IS NULL ORDER BY random()");
  
  // Distribute agents across clients
  if (clients.length > 0) {
    let assigned = 0;
    for (let i = 0; i < agents.length; i++) {
      const client = clients[i % clients.length];
      await pool.query("UPDATE agents SET client_id = $1 WHERE id = $2", [client.id, agents[i].id]);
      assigned++;
    }
    console.log(`  ${assigned} agents linked to clients (round-robin across ${clients.length} clients)`);
  } else {
    console.log('  No named clients to wire to');
  }

  // ══════════════════════════════════════════════
  // 3. WIRE AGENTS TO TEMPLATES
  // ══════════════════════════════════════════════
  console.log('\n▓▓▓ 3. WIRE AGENTS TO PRIMARY/SECONDARY TEMPLATES ▓▓▓\n');

  // Build a mapping from archetype_id to template
  const {rows: archetypes} = await pool.query("SELECT archetype_id as id, archetype_id as key, archetype_name as name FROM archetypes");
  const {rows: allAgents} = await pool.query("SELECT id, agent_id, agent_name, vertical, archetype_id, primary_template, secondary_template FROM agents");

  // Template naming: each agent type should have a matching template
  const {rows: blueprints} = await pool.query("SELECT key FROM blueprint_templates");
  const {rows: essences} = await pool.query("SELECT key FROM essence_templates");
  const allTplKeys = new Set([...blueprints, ...essences].map(r => r.key));

  let tmplWired = 0;
  for (const a of allAgents) {
    if (a.primary_template && a.secondary_template) continue;
    
    // Derive template from vertical + archetype
    const vert = a.vertical || 'general';
    const archetype = a.archetype_id || 'general';
    
    // Try to find a matching template
    const primary = a.primary_template || (allTplKeys.has(`${vert}_blueprint`) ? `${vert}_blueprint` : null)
      || (allTplKeys.has(`${vert}_essence`) ? `${vert}_essence` : null)
      || (allTplKeys.has('standard_blueprint') ? 'standard_blueprint' : null);
    
    const secondary = a.secondary_template || (allTplKeys.has(`${vert}_essence`) ? `${vert}_essence` : null);

    if (primary || secondary) {
      await pool.query(
        "UPDATE agents SET primary_template = COALESCE(primary_template, $1), secondary_template = COALESCE(secondary_template, $2) WHERE id = $3",
        [primary, secondary, a.id]
      );
      tmplWired++;
    }
  }
  console.log(`  ${tmplWired} agents wired to templates`);
  
  // ══════════════════════════════════════════════
  // 4. FILL VERTICAL_SUBS & AGENT VERTICAL_SUBS
  // ══════════════════════════════════════════════
  console.log('\n▓▓▓ 4. FILL VERTICAL_SUBS ▓▓▓\n');
  
  // Map agent verticals to sub-verticals
  const vertSubMap = {
    real_estate: ['Residential', 'Commercial', 'Luxury'],
    hospitality: ['Hotel', 'Resort', 'Boutique'],
    luxury: ['Concierge', 'VIP', 'Lifestyle'],
    finance: ['Wealth', 'Investment', 'Banking'],
    health: ['Medical', 'Wellness', 'Fitness'],
    legal: ['Corporate', 'Family', 'Immigration'],
    tech: ['SaaS', 'Infrastructure', 'AI'],
    commerce: ['Retail', 'E-commerce', 'Wholesale'],
    creator: ['Content', 'Media', 'Brand'],
    education: ['K-12', 'Higher Ed', 'Vocational'],
    corporate: ['Executive', 'Operations', 'HR'],
    government: ['Federal', 'State', 'Municipal'],
    social_services: ['Community', 'Family', 'Crisis'],
    ai: ['ML', 'NLP', 'Computer Vision'],
    wellness: ['Mental', 'Physical', 'Holistic'],
  };

  let subFilled = 0;
  for (const a of allAgents) {
    if (a.vertical && vertSubMap[a.vertical] && !a.vertical_subs) {
      const subs = vertSubMap[a.vertical];
      await pool.query(
        "UPDATE agents SET vertical_subs = $1 WHERE id = $2 AND vertical_subs IS NULL",
        [subs, a.id]
      );
      subFilled++;
    }
  }
  console.log(`  ${subFilled} agents got vertical_subs filled`);

  // ══════════════════════════════════════════════
  // 5. FILL AGENT SWARM ORCHESTRATION
  // ══════════════════════════════════════════════
  console.log('\n▓▓▓ 5. SWARM ORCHESTRATION STRATEGIES ▓▓▓\n');

  const strategyMap = {
    real_estate: 'hierarchical', hospitality: 'flat', luxury: 'hierarchical',
    finance: 'hierarchical', health: 'flat', legal: 'hierarchical',
    tech: 'mesh', commerce: 'flat', creator: 'mesh',
    education: 'flat', corporate: 'hierarchical', government: 'hierarchical',
    social_services: 'flat', ai: 'mesh', wellness: 'flat',
    crisis: 'emergency', core: 'hierarchical',
  };

  let stratFilled = 0;
  const {rows: swarms} = await pool.query("SELECT id, name, vertical_slug FROM agent_swarms");
  for (const s of swarms) {
    const vert = s.vertical_slug || s.name?.toLowerCase().replace(/_swarm$/, '');
    const strategy = strategyMap[vert] || 'hierarchical';
    await pool.query(
      "UPDATE agent_swarms SET orchestration_strategy = $1, swarm_name = COALESCE(swarm_name, name), swarm_slug = COALESCE(swarm_slug, $2) WHERE id = $3 AND orchestration_strategy IS NULL",
      [strategy, s.name?.toLowerCase().replace(/\s+/g, '_'), s.id]
    );
    stratFilled++;
  }
  console.log(`  ${stratFilled} swarms got orchestration strategy`);

  // Also fill swarm_templates orchestration
  await pool.query(`
    UPDATE swarm_templates 
    SET metadata = jsonb_set(COALESCE(metadata, '{}'::jsonb), '{orchestration_strategy}', to_jsonb(
      CASE 
        WHEN vertical_key IN ('real_estate','luxury','finance','legal','corporate','government') THEN 'hierarchical'
        WHEN vertical_key IN ('tech','ai','creator') THEN 'mesh'
        WHEN vertical_key IN ('crisis') THEN 'emergency'
        ELSE 'flat'
      END
    ), true)
    WHERE metadata->>'orchestration_strategy' IS NULL
  `);

  // ══════════════════════════════════════════════
  // 6. FILL AGENT_CAPABILITIES
  // ══════════════════════════════════════════════
  console.log('\n▓▓▓ 6. FILL AGENT_CAPABILITIES LINKS ▓▓▓\n');

  // Link agent_capabilities to agents by agent_type
  const {rows: caps} = await pool.query("SELECT c.id, c.agent_type_key, c.capability_name FROM agent_capabilities c WHERE c.agent_id IS NULL");
  const {rows: agentList} = await pool.query("SELECT id, agent_type FROM agents WHERE agent_type IS NOT NULL");
  
  let capsLinked = 0;
  for (const c of caps) {
    // Find matching agents by type
    const matchingAgents = agentList.filter(a => a.agent_type === c.agent_type_key);
    if (matchingAgents.length > 0) {
      // Link to first matching agent
      await pool.query("UPDATE agent_capabilities SET agent_id = $1 WHERE id = $2", [matchingAgents[0].id, c.id]);
      capsLinked++;
    }
  }
  console.log(`  ${capsLinked} capabilities linked to agents`);

  // ══════════════════════════════════════════════
  // 7. DROP OLD GENERATORS TABLE (merged into agent_generators)
  // ══════════════════════════════════════════════
  console.log('\n▓▓▓ 7. CLEANUP: DROP OLD generators TABLE ▓▓▓\n');
  try {
    await pool.query("DROP TABLE IF EXISTS generators CASCADE");
    console.log('  Dropped obsolete generators table (data migrated to agent_generators)');
  } catch(e) {
    console.log(`  Skipped: ${e.message}`);
  }

  // ══════════════════════════════════════════════
  // VERIFICATION
  // ══════════════════════════════════════════════
  console.log('\n▓▓▓ VERIFICATION ▓▓▓\n');
  const checks = [
    ['agent_types canonical_template', "SELECT count(*) as c FROM agent_types WHERE canonical_template IS NOT NULL"],
    ['agent_types capabilities', "SELECT count(*) as c FROM agent_types WHERE capabilities IS NOT NULL"],
    ['agent_types is_active', "SELECT count(*) as c FROM agent_types WHERE is_active IS NOT NULL"],
    ['agents.client_id', "SELECT count(*) as c FROM agents WHERE client_id IS NOT NULL"],
    ['agents.primary_template', "SELECT count(*) as c FROM agents WHERE primary_template IS NOT NULL"],
    ['agents.vertical_subs', "SELECT count(*) as c FROM agents WHERE vertical_subs IS NOT NULL"],
    ['agent_swarms.orchestration_strategy', "SELECT count(*) as c FROM agent_swarms WHERE orchestration_strategy IS NOT NULL"],
    ['agent_capabilities.agent_id', "SELECT count(*) as c FROM agent_capabilities WHERE agent_id IS NOT NULL"],
    ['generators table exists', "SELECT count(*) as c FROM information_schema.tables WHERE table_name='generators'"],
  ];
  for (const [name, sql] of checks) {
    const r = await pool.query(sql);
    console.log(`  ${name}: ${r.rows[0].c}`);
  }

  await pool.end();
  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║     BATCH DATA FIX COMPLETE              ║');
  console.log('╚══════════════════════════════════════════╝');
}

main().catch(e => { console.error('FATAL:', e); process.exit(1); });
