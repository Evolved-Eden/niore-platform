import pg from 'pg';

const pool = new pg.Pool({
  host: 'db.jebixydqpvsegvrtfmgm.supabase.co', port: 5432, database: 'postgres',
  user: 'postgres', password: process.argv[2],
  ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 15000,
});

// ── Helpers ──
function cleanName(s) { return (s||'').trim(); }
function slugify(s) { return s.toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,''); }

// ── Main ──
async function main() {
  console.log('╔══════════════════════════════════════════╗');
  console.log('║     SWARM FIX — Scores, Templates, Cleanup  ║');
  console.log('╚══════════════════════════════════════════╝\n');

  // 1. Fix swarm_templates — remove null-key rows
  console.log('▓▓▓ 1. SWARM TEMPLATES CLEANUP ▓▓▓\n');
  const del = await pool.query("DELETE FROM swarm_templates WHERE key IS NULL OR key = ''");
  console.log(`  Deleted ${del.rowCount} templates with NULL/empty key`);

  // Fix templates that have name but no key — derive key from name
  const {rows: orphans} = await pool.query("SELECT id, name, swarm_name FROM swarm_templates WHERE key IS NULL AND (name IS NOT NULL OR swarm_name IS NOT NULL)");
  for (const o of orphans) {
    const n = o.name || o.swarm_name;
    const k = slugify(n) + '_swarm';
    await pool.query("UPDATE swarm_templates SET key = $1 WHERE id = $2", [k, o.id]);
    console.log(`  Fixed: "${n}" → key="${k}"`);
  }

  // Ensure unique keys
  const {rows: dups} = await pool.query("SELECT key, count(*) FROM swarm_templates GROUP BY key HAVING count(*) > 1");
  for (const d of dups) {
    const {rows: r} = await pool.query("SELECT id, key FROM swarm_templates WHERE key = $1 ORDER BY created_at", [d.key]);
    for (let i = 1; i < r.length; i++) {
      await pool.query("DELETE FROM swarm_templates WHERE id = $1", [r[i].id]);
      console.log(`  Removed duplicate template: ${r[i].key}`);
    }
  }

  // 2. Gather all agents
  console.log('\n▓▓▓ 2. AGENT DATA ▓▓▓\n');
  const {rows: agents} = await pool.query(`
    SELECT id, agent_id, agent_name, vertical, role_type, mas_score, mas_state, mas_category
    FROM agents WHERE agent_id IS NOT NULL ORDER BY agent_name
  `);
  console.log(`  Loaded ${agents.length} agents`);

  // Index agents by vertical + id
  const agentsById = {};
  const agentsByVert = {};
  for (const a of agents) {
    agentsById[a.id] = a;
    agentsById[a.agent_id] = a;
    const v = a.vertical || 'unassigned';
    if (!agentsByVert[v]) agentsByVert[v] = [];
    agentsByVert[v].push(a);
  }

  // 3. Define all swarm templates and their agent mappings
  console.log('\n▓▓▓ 3. BUILDING SWARM TEMPLATES ▓▓▓\n');

  const verticalSwarmConfig = {
    // Each entry: agents that match this vertical (plus optionally special filters)
    real_estate: { name: 'Real Estate Swarm', match: { vertical: 'real_estate' } },
    hospitality: { name: 'Hospitality Swarm', match: { vertical: 'hospitality' } },
    luxury: { name: 'Luxury Concierge Swarm', match: { vertical: 'luxury' } },
    finance: { name: 'Finance Swarm', match: { vertical: 'finance' } },
    legal: { name: 'Legal & Compliance Swarm', match: { vertical: 'legal' } },
    health: { name: 'Health & Wellness Swarm', match: { vertical: 'health' } },
    mental_health: { name: 'Mental Health Swarm', match: { vertical: 'mental_health' } },
    tech: { name: 'Technology AI Swarm', match: { vertical: 'tech' } },
    commerce: { name: 'Commerce Swarm', match: { vertical: 'commerce' } },
    creator: { name: 'Creator Growth Swarm', match: { vertical: 'creator' } },
    media: { name: 'Media Swarm', match: { vertical: 'media' } },
    education: { name: 'Education Swarm', match: { vertical: 'education' } },
    food: { name: 'Food & Beverage Swarm', match: { vertical: 'food' } },
    beauty: { name: 'Beauty & Wellness Swarm', match: { vertical: 'beauty' } },
    sports: { name: 'Sports & Fitness Swarm', match: { vertical: 'sports' } },
    travel: { name: 'Travel & Tourism Swarm', match: { vertical: 'travel' } },
    corporate: { name: 'Corporate Enterprise Swarm', match: { vertical: 'corporate' } },
    government: { name: 'Government & Public Swarm', match: { vertical: 'government' } },
    social_services: { name: 'Social Services Swarm', match: { vertical: 'social_services' } },
    ai: { name: 'AI Intelligence Swarm', match: { vertical: 'ai' } },
    youth: { name: 'Youth & Development Swarm', match: { vertical: 'youth' } },
    early_childhood: { name: 'Early Childhood Swarm', match: { vertical: 'early_childhood' } },
    sustainability: { name: 'Sustainability Swarm', match: { vertical: 'sustainability' } },
    manufacturing: { name: 'Manufacturing Swarm', match: { vertical: 'manufacturing' } },
    arts: { name: 'Arts & Culture Swarm', match: { vertical: 'arts' } },
    wealth: { name: 'Wealth Management Swarm', match: { vertical: 'wealth' } },
    immigration: { name: 'Immigration Services Swarm', match: { vertical: 'immigration' } },
    veterans: { name: 'Veterans Support Swarm', match: { vertical: 'veterans' } },
    addiction: { name: 'Addiction Recovery Swarm', match: { vertical: 'addiction' } },
    elder_care: { name: 'Elder Care Swarm', match: { vertical: 'elder_care' } },
    events: { name: 'Events Management Swarm', match: { vertical: 'events' } },
    corporate_extended: { name: 'Corporate Extended Swarm', match: { vertical: 'corporate_extended' } },
    legacy: { name: 'Legacy & Philanthropy Swarm', match: { vertical: 'legacy' } },
    spiritual: { name: 'Spiritual & Wellness Swarm', match: { vertical: 'spiritual' } },
    relationships: { name: 'Relationships & Coaching Swarm', match: { vertical: 'relationships' } },
    financial_crisis: { name: 'Financial Crisis Support Swarm', match: { vertical: 'financial_crisis' } },
    crisis: { name: 'Crisis Response Swarm', match: { vertical: 'crisis' } },
    global_impact: { name: 'Global Impact Swarm', match: { vertical: 'global_impact' } },
    infrastructure: { name: 'Infrastructure Swarm', match: { vertical: 'infrastructure' } },
  };

  // Role-based swarms
  const roleSwarmConfig = {
    core_swarm: { name: 'Core Orchestration Swarm', match: { role: 'CORE' }, template_type: 'core' },
    bridge_swarm: { name: 'Bridge Integration Swarm', match: { role: 'BRIDGE' }, template_type: 'bridge' },
    crisis_swarm: { name: 'Crisis Intervention Swarm', match: { role: 'CRISIS' }, template_type: 'crisis' },
    cross_system_swarm: { name: 'Cross-System Integration Swarm', match: { role: 'CROSS_SYSTEM' }, template_type: 'cross_system' },
    utility_swarm: { name: 'Utility Services Swarm', match: { role: 'UTILITY' }, template_type: 'utility' },
  };

  // Build agent sets for each template
  const templateAgentMap = {}; // key -> Set of agent_ids

  // Vertical swarms
  for (const [vk, cfg] of Object.entries(verticalSwarmConfig)) {
    const key = `${vk}_swarm`;
    const matched = agents.filter(a => (a.vertical||'') === vk);
    templateAgentMap[key] = new Set(matched.map(a => a.agent_id));
  }

  // Role swarms
  for (const [key, cfg] of Object.entries(roleSwarmConfig)) {
    const matched = agents.filter(a => (a.role_type||'') === cfg.match.role);
    templateAgentMap[key] = new Set(matched.map(a => a.agent_id));
  }

  // Special composite swarms
  templateAgentMap['service_concierge_swarm'] = new Set(
    agents.filter(a => ['hospitality','luxury','travel'].includes(a.vertical||'')).map(a => a.agent_id)
  );
  templateAgentMap['sales_realestate_swarm'] = new Set(
    agents.filter(a => (a.vertical||'') === 'real_estate' && (a.agent_name||'').toLowerCase().match(/sales|lead|acquisition|conversion|deal/)).map(a => a.agent_id)
  );
  templateAgentMap['sales_enterprise_swarm'] = new Set(
    agents.filter(a => ['corporate','corporate_extended'].includes(a.vertical||'') && (a.agent_name||'').toLowerCase().match(/sales|lead|revenue|growth|deal/)).map(a => a.agent_id)
  );
  templateAgentMap['ops_internal_swarm'] = new Set(
    agents.filter(a => (a.vertical||'') === 'core' || (a.role_type||'') === 'UTILITY').map(a => a.agent_id)
  );
  templateAgentMap['executive_ops_swarm'] = new Set(
    agents.filter(a => (a.agent_name||'').toLowerCase().match(/executive|admin|front.?desk|concierge|orchestrat|evolution|coordinat/)).map(a => a.agent_id)
  );
  templateAgentMap['research_intelligence_swarm'] = new Set(
    agents.filter(a => (a.agent_name||'').toLowerCase().match(/intelligence|research|analytics|analyst|insight|data/)).map(a => a.agent_id)
  );
  templateAgentMap['multi_vertical_bridge_swarm'] = templateAgentMap['bridge_swarm']; // same as bridge
  templateAgentMap['zuri_master_swarm'] = new Set(agents.map(a => a.agent_id)); // ALL agents
  templateAgentMap['zuri_front_desk_swarm'] = new Set(
    agents.filter(a => (a.agent_name||'').toLowerCase().match(/front.?desk|intake|concierge|reception|gateway|router|master.?concierge/)).map(a => a.agent_id)
  );
  templateAgentMap['zuri_spiritual_swarm'] = new Set(
    agents.filter(a => (a.vertical||'') === 'spiritual' || (a.agent_name||'').toLowerCase().match(/spiritual|meditation|mindful|consciousness|energy/)).map(a => a.agent_id)
  );
  templateAgentMap['zuri_personal_concierge_swarm'] = new Set(
    agents.filter(a => (a.vertical||'') === 'luxury' || (a.agent_name||'').toLowerCase().match(/concierge|personal|vip|client.*experience/)).map(a => a.agent_id)
  );
  templateAgentMap['zuri_business_swarm'] = new Set(
    agents.filter(a => ['corporate','finance','wealth','legal','commerce','manufacturing'].includes(a.vertical||'')).map(a => a.agent_id)
  );
  templateAgentMap['zuri_creator_swarm'] = new Set(
    agents.filter(a => ['creator','media','arts','events'].includes(a.vertical||'')).map(a => a.agent_id)
  );
  templateAgentMap['zuri_internal_ops_swarm'] = templateAgentMap['ops_internal_swarm'];
  templateAgentMap['zuri_meta_swarm'] = new Set(agents.map(a => a.agent_id));

  // Ensure all keys exist. If a template key doesn't exist yet, create it.
  const allTemplateKeys = Object.keys(templateAgentMap);
  const knownSwarms = await pool.query("SELECT key FROM swarm_templates");
  const existingKeys = new Set(knownSwarms.rows.map(r => r.key));

  let created = 0, updated = 0;
  for (const key of allTemplateKeys) {
    const agentsArr = [...templateAgentMap[key]];
    const agentStr = agentsArr.join(',');
    const memberCount = agentsArr.length;

    // Get display name from configs
    const vertCfg = verticalSwarmConfig[key.replace(/_swarm$/,'')];
    const roleCfg = roleSwarmConfig[key];
    let displayName = vertCfg?.name || roleCfg?.name || 
      key.replace(/_/g,' ').replace(/\b\w/g, l => l.toUpperCase()).replace(' Zuri ','Zuri ');

    if (!existingKeys.has(key)) {
      await pool.query(`
        INSERT INTO swarm_templates (key, name, description, member_agents, is_active, template_type, vertical_key)
        VALUES ($1, $2, $3, $4, true, $5, $6)
      `, [key, displayName, `${displayName}: ${memberCount} agents`, agentStr,
          vertCfg ? 'vertical' : (roleCfg?.template_type || 'swarm'),
          vertCfg ? key.replace(/_swarm$/,'') : null
      ]);
      created++;
      console.log(`  ✚ Created "${key}" (${memberCount} agents)`);
    } else {
      await pool.query(`
        UPDATE swarm_templates 
        SET member_agents = $1, name = COALESCE(NULLIF(name,''), $2), 
            description = COALESCE(NULLIF(description,''), $3),
            template_type = COALESCE(NULLIF(template_type,''), $5),
            vertical_key = COALESCE(vertical_key, $6)
        WHERE key = $4
      `, [agentStr, displayName, `${displayName}: ${memberCount} agents`, key,
          vertCfg ? 'vertical' : (roleCfg?.template_type || 'swarm'),
          vertCfg ? key.replace(/_swarm$/,'') : null
      ]);
      updated++;
      console.log(`  ✓ Updated "${key}" (${memberCount} agents)`);
    }
  }
  console.log(`\n  Templates: ${created} created, ${updated} updated`);

  // 4. Fix swarm_agents MAS scores
  console.log('\n▓▓▓ 4. SWARM AGENTS MAS SCORES ▓▓▓\n');
  
  // Update swarm_agents.mas_score from agents table
  const masUpdate = await pool.query(`
    UPDATE swarm_agents sa
    SET mas_score = a.mas_score,
        mas_vector = a.mas_vector,
        avg_mas_score = a.mas_score
    FROM agents a
    WHERE sa.agent_id = a.id
      AND sa.mas_score IS NULL
      AND a.mas_score IS NOT NULL
  `);
  console.log(`  Updated ${masUpdate.rowCount} swarm_agents MAS scores`);

  // For any remaining NULL scores, calculate from agent_ids
  const remainingNull = await pool.query("SELECT count(*) as c FROM swarm_agents WHERE mas_score IS NULL");
  if (remainingNull.rows[0].c > 0) {
    console.log(`  ${remainingNull.rows[0].c} swarm_agents still have NULL scores (no matching agent)`);
  }

  // 5. Compute avg MAS per swarm (grouped by swarm_id)
  console.log('\n▓▓▓ 5. SWARM-LEVEL AVERAGE MAS ▓▓▓\n');
  
  // For swarm_agents, update based on linked swarm
  const swarmAvgUpdate = await pool.query(`
    UPDATE swarm_agents sa
    SET avg_mas_score = sub.avg_score
    FROM (
      SELECT swarm_id, round(avg(mas_score)::numeric, 4) as avg_score
      FROM swarm_agents
      WHERE mas_score IS NOT NULL
      GROUP BY swarm_id
    ) sub
    WHERE sa.swarm_id = sub.swarm_id
  `);
  console.log(`  Updated avg_mas_score for ${swarmAvgUpdate.rowCount} swarm_agents`);

  // 6. Fix agent_swarms duplicates
  console.log('\n▓▓▓ 6. AGENT SWARMS DEDUP ▓▓▓\n');
  
  // Find and merge duplicate named swarms
  const {rows: dupSwarms} = await pool.query(`
    SELECT name, count(*) as cnt, 
           string_agg(id::text, ',') as ids,
           string_agg(mas_score::text, ',') as scores
    FROM agent_swarms 
    WHERE name IS NOT NULL AND name != ''
    GROUP BY name
    HAVING count(*) > 1
    ORDER BY cnt DESC
  `);
  
  let mergedCount = 0;
  for (const dup of dupSwarms) {
    const ids = dup.ids.split(',');
    const scores = dup.scores.split(',').map(Number);
    
    // Keep the one with highest MAS score, or first if all same
    let bestIdx = 0;
    let bestScore = -1;
    for (let i = 0; i < ids.length; i++) {
      if (scores[i] > bestScore) { bestScore = scores[i]; bestIdx = i; }
    }
    const keepId = ids[bestIdx];
    const deleteIds = ids.filter((_, i) => i !== bestIdx);
    
    // Reassign swarm_agents links
    for (const delId of deleteIds) {
      // Update swarm_agents to point to kept swarm
      await pool.query("UPDATE swarm_agents SET swarm_id = $1 WHERE swarm_id = $2", [keepId, delId]);
      // Delete the duplicate
      await pool.query("DELETE FROM agent_swarms WHERE id = $1", [delId]);
      mergedCount++;
    }
  }
  console.log(`  Merged ${mergedCount} duplicate agent_swarms`);

  // Update agent_swarms MAS scores with computed averages
  const swarmScoreUpdate = await pool.query(`
    UPDATE agent_swarms a
    SET mas_score = sub.avg_score,
        active_agents = sub.agent_count
    FROM (
      SELECT sa.swarm_id, 
             round(avg(coalesce(sa.mas_score, a2.mas_score, 0))::numeric, 4) as avg_score,
             count(*)::int as agent_count
      FROM swarm_agents sa
      LEFT JOIN agents a2 ON sa.agent_id = a2.id
      GROUP BY sa.swarm_id
    ) sub
    WHERE a.id = sub.swarm_id
      AND sub.avg_score > 0
  `);
  console.log(`  Updated MAS scores for ${swarmScoreUpdate.rowCount} agent_swarms`);

  // 7. Fix agent_swarm_members scores
  console.log('\n▓▓▓ 7. AGENT SWARM MEMBERS SCORES ▓▓▓\n');
  const memberUpdate = await pool.query(`
    UPDATE agent_swarm_members m
    SET swarm_mas_score = a.mas_score
    FROM agents a
    WHERE m.agent_id = a.id
      AND m.swarm_mas_score IS NULL
      AND a.mas_score IS NOT NULL
  `);
  console.log(`  Updated ${memberUpdate.rowCount} agent_swarm_members scores`);

  // 8. Final verification
  console.log('\n▓▓▓ 8. VERIFICATION ▓▓▓\n');
  const checks = [
    ['swarm_templates', "SELECT count(*) as c FROM swarm_templates WHERE key IS NOT NULL"],
    ['templates_with_members', "SELECT count(*) as c FROM swarm_templates WHERE member_agents IS NOT NULL AND member_agents != ''"],
    ['swarm_agents_mas_filled', "SELECT count(*) as c FROM swarm_agents WHERE mas_score IS NOT NULL"],
    ['swarm_agents_avg_filled', "SELECT count(*) as c FROM swarm_agents WHERE avg_mas_score IS NOT NULL"],
    ['agent_swarms_unique', "SELECT count(*) as c FROM (SELECT name, count(*) FROM agent_swarms WHERE name IS NOT NULL AND name != '' GROUP BY name HAVING count(*) > 1) dup"],
    ['agent_swarms_mas_score', "SELECT round(avg(mas_score)::numeric,2) as c FROM agent_swarms WHERE mas_score > 0"],
    ['agent_swarm_members_filled', "SELECT count(*) as c FROM agent_swarm_members WHERE swarm_mas_score IS NOT NULL"],
  ];
  for (const [name, sql] of checks) {
    const r = await pool.query(sql);
    console.log(`  ${name}: ${JSON.stringify(r.rows[0].c)}`);
  }

  await pool.end();
  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║     SWARM FIX COMPLETE                  ║');
  console.log('╚══════════════════════════════════════════╝');
}

main().catch(e => { console.error('FATAL:', e); process.exit(1); });
