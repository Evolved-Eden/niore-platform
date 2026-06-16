import pg from 'pg';

const pool = new pg.Pool({
  host: 'db.jebixydqpvsegvrtfmgm.supabase.co', port: 5432, database: 'postgres',
  user: 'postgres', password: process.argv[2],
  ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 15000,
});

async function main() {
  console.log('╔══════════════════════════════════════════╗');
  console.log('║   BATCH FIX: Steps 3-7 (fixed schema)    ║');
  console.log('╚══════════════════════════════════════════╝\n');

  // ══════════════════════════════════════════════
  // 3. WIRE AGENTS TO TEMPLATES
  // ══════════════════════════════════════════════
  console.log('▓▓▓ 3. WIRE AGENTS TO PRIMARY/SECONDARY TEMPLATES ▓▓▓\n');

  // Check which templates exist
  const {rows: allAgents} = await pool.query("SELECT id, agent_id, agent_name, vertical, archetype_id, primary_template, secondary_template FROM agents");

  // Check archetypes table — uses archetype_id, not id
  const {rows: archetypes} = await pool.query("SELECT archetype_id, archetype_name, category FROM archetypes");
  
  // Check what templates exist
  const {rows: bps} = await pool.query("SELECT key, name FROM blueprint_templates LIMIT 20");
  const {rows: essences} = await pool.query("SELECT key, name FROM essence_templates LIMIT 20");
  const {rows: wfs} = await pool.query("SELECT key, name FROM workflow_templates LIMIT 20");

  console.log(`  Available: ${bps.length} blueprints, ${essences.length} essences, ${wfs.length} workflow templates`);
  
  const allTplKeys = new Set([
    ...bps.map(r => r.key), ...essences.map(r => r.key), ...wfs.map(r => r.key)
  ].filter(Boolean));
  
  console.log(`  Sample template keys: ${[...allTplKeys].slice(0,15).join(', ')}`);

  let tmplWired = 0;
  for (const a of allAgents) {
    if (a.primary_template && a.secondary_template) continue;
    
    const vert = a.vertical || 'general';
    
    // Try vertical naming patterns
    const candidates = [
      `${vert}_blueprint`, `${vert}_essence`, `${vert}_workflow`,
      'standard_blueprint', 'default_blueprint', 'base_blueprint',
      'onboarding_workflow', 'core_processing_workflow'
    ];
    
    const primary = a.primary_template || candidates.find(c => allTplKeys.has(c)) || null;
    const secondary = a.secondary_template || (primary ? `${vert}_essence` : null);
    
    // Only update if we found something and the column needs filling
    if (primary && !a.primary_template) {
      const r = await pool.query(
        "UPDATE agents SET primary_template = $1, secondary_template = COALESCE(secondary_template, $2) WHERE id = $3 AND primary_template IS NULL",
        [primary, secondary, a.id]
      );
      if (r.rowCount > 0) tmplWired++;
    }
  }
  console.log(`  ${tmplWired} agents wired to templates`);

  // ══════════════════════════════════════════════
  // 4. FILL VERTICAL_SUBS
  // ══════════════════════════════════════════════
  console.log('\n▓▓▓ 4. FILL VERTICAL_SUBS ▓▓▓\n');
  
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
    core: ['Foundation', 'Platform', 'System'],
    crisis: ['Emergency', 'Urgent', 'Critical'],
    utility: ['Infrastructure', 'Support', 'Tooling'],
  };

  let subFilled = 0;
  for (const a of allAgents) {
    if (a.vertical && vertSubMap[a.vertical]) {
      const subs = vertSubMap[a.vertical];
      const r = await pool.query(
        "UPDATE agents SET vertical_subs = $1 WHERE id = $2 AND vertical_subs IS NULL",
        [subs, a.id]
      );
      if (r.rowCount > 0) subFilled++;
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
  const {rows: swarms} = await pool.query("SELECT id, name, vertical_slug, orchestration_strategy FROM agent_swarms");
  
  for (const s of swarms) {
    if (s.orchestration_strategy) continue; // skip already filled
    
    const vert = s.vertical_slug || s.name?.toLowerCase().replace(/_swarm$/, '').replace(/\s+/g, '_');
    const strategy = strategyMap[vert] || 'hierarchical';
    
    await pool.query(
      "UPDATE agent_swarms SET orchestration_strategy = $1, swarm_name = COALESCE(swarm_name, name), swarm_slug = COALESCE(swarm_slug, $2) WHERE id = $3",
      [strategy, s.name?.toLowerCase().replace(/\s+/g, '_'), s.id]
    );
    stratFilled++;
  }
  console.log(`  ${stratFilled} swarms got orchestration strategy`);

  // Also fill swarm_templates orchestration in metadata
  const {rowCount: stFilled} = await pool.query(`
    UPDATE swarm_templates 
    SET metadata = jsonb_set(COALESCE(metadata, '{}'::jsonb), '{orchestration_strategy}', to_jsonb(
      CASE 
        WHEN vertical_key IN ('real_estate','luxury','finance','legal','corporate','government') THEN 'hierarchical'
        WHEN vertical_key IN ('tech','ai','creator') THEN 'mesh'
        WHEN vertical_key IN ('crisis') THEN 'emergency'
        ELSE 'flat'
      END
    ), true)
    WHERE metadata IS NULL OR metadata->>'orchestration_strategy' IS NULL
  `);
  console.log(`  ${stFilled || 0} swarm_templates got orchestration`);

  // ══════════════════════════════════════════════
  // 6. FILL AGENT_CAPABILITIES — link to agents and fill agent_type_key
  // ══════════════════════════════════════════════
  console.log('\n▓▓▓ 6. FILL AGENT_CAPABILITIES ▓▓▓\n');

  // Build capability_key → agent_type mapping
  const capToAgentType = {
    'calendar_access': 'concierge_booking',
    'sms_messaging': 'lead_sales',
    'email_messaging': 'lead_sales',
    'voice_calls': 'concierge_booking',
    'booking_engine': 'concierge_booking',
    'payment_processing': 'lead_sales',
    'document_generation': 'intake_consultation',
    'knowledge_base': 'intelligence_agent',
    'analytics': 'analytics_agent',
    'integration': 'integration_agent',
    'monitoring': 'orchestration_agent',
    'scheduling': 'orchestration_agent',
    'notification': 'lead_sales',
    'workflow': 'orchestration_agent',
    'reporting': 'analytics_agent',
    'search': 'intelligence_agent',
    'forecasting': 'forecasting_agent',
    'lead_scoring': 'lead_sales',
    'chat': 'lead_sales',
    'onboarding': 'onboarding_agent',
  };

  const {rows: allCaps} = await pool.query("SELECT id, capability_key, agent_type_key FROM agent_capabilities");
  
  let capsFilled = 0;
  for (const c of allCaps) {
    const agentTypeKey = capToAgentType[c.capability_key] || null;
    
    if (agentTypeKey) {
      // Find matching agents
      const {rows: matches} = await pool.query(
        "SELECT id FROM agents WHERE agent_type = $1 LIMIT 1",
        [agentTypeKey]
      );
      
      if (matches.length > 0) {
        await pool.query(
          "UPDATE agent_capabilities SET agent_id = $1, agent_type_key = $2, workflow_key = $3 WHERE id = $4",
          [matches[0].id, agentTypeKey, `${agentTypeKey}_workflow`, c.id]
        );
        capsFilled++;
      }
    }
  }
  // For remaining unmatched caps, link to integration or orchestration agents
  const {rows: remaining} = await pool.query("SELECT id, capability_key FROM agent_capabilities WHERE agent_id IS NULL LIMIT 50");
  for (const c of remaining) {
    const {rows: fallback} = await pool.query(
      "SELECT id FROM agents WHERE agent_type IN ('integration_agent','orchestration_agent') LIMIT 1"
    );
    if (fallback.length > 0) {
      await pool.query(
        "UPDATE agent_capabilities SET agent_id = $1, agent_type_key = 'integration_agent' WHERE id = $2",
        [fallback[0].id, c.id]
      );
      capsFilled++;
    }
  }
  console.log(`  ${capsFilled} capabilities linked to agents`);

  // ══════════════════════════════════════════════
  // 7. DROP OLD GENERATORS TABLE
  // ══════════════════════════════════════════════
  console.log('\n▓▓▓ 7. CLEANUP: DROP OLD generators TABLE ▓▓▓\n');
  try {
    await pool.query("DROP TABLE IF EXISTS generators CASCADE");
    console.log('  Dropped obsolete generators table');
  } catch(e) {
    console.log(`  Skipped: ${e.message}`);
  }

  // ══════════════════════════════════════════════
  // VERIFICATION
  // ══════════════════════════════════════════════
  console.log('\n▓▓▓ VERIFICATION ▓▓▓\n');
  const checks = [
    ['agent_types canonical_template', "SELECT count(*)::int as c FROM agent_types WHERE canonical_template IS NOT NULL"],
    ['agent_types capabilities', "SELECT count(*)::int as c FROM agent_types WHERE capabilities IS NOT NULL"],
    ['agent_types is_active', "SELECT count(*)::int as c FROM agent_types WHERE is_active IS true"],
    ['agents.client_id', "SELECT count(*)::int as c FROM agents WHERE client_id IS NOT NULL"],
    ['agents.primary_template', "SELECT count(*)::int as c FROM agents WHERE primary_template IS NOT NULL"],
    ['agents.secondary_template', "SELECT count(*)::int as c FROM agents WHERE secondary_template IS NOT NULL"],
    ['agents.vertical_subs', "SELECT count(*)::int as c FROM agents WHERE vertical_subs IS NOT NULL"],
    ['agent_swarms.orchestration_strategy', "SELECT count(*)::int as c FROM agent_swarms WHERE orchestration_strategy IS NOT NULL"],
    ['agent_capabilities.agent_id', "SELECT count(*)::int as c FROM agent_capabilities WHERE agent_id IS NOT NULL"],
    ['agent_capabilities.agent_type_key', "SELECT count(*)::int as c FROM agent_capabilities WHERE agent_type_key IS NOT NULL"],
    ['generators table exists', "SELECT count(*)::int as c FROM information_schema.tables WHERE table_name='generators'"],
  ];
  for (const [name, sql] of checks) {
    try {
      const r = await pool.query(sql);
      console.log(`  ${name}: ${r.rows[0].c}`);
    } catch(e) {
      console.log(`  ${name}: ERROR - ${e.message}`);
    }
  }

  await pool.end();
  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║     BATCH DATA FIX 2 COMPLETE             ║');
  console.log('╚══════════════════════════════════════════╝');
}

main().catch(e => { console.error('FATAL:', e); process.exit(1); });
