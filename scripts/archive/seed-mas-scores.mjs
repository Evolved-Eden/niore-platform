import pg from 'pg';

const password = process.argv[2] || process.env.SUPABASE_DB_PASSWORD ;

const POOL_CONFIG = {
  host: 'db.jebixydqpvsegvrtfmgm.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 10000,
};

// ── Agent category classification ──
function classifyAgent(name, roleType, agentId) {
  const n = (name || '').toLowerCase();
  const id = (agentId || '').toLowerCase();
  const role = (roleType || '').toUpperCase();
  const combined = n + ' ' + id;

  // Orchestrator / system-core agents
  if (role === 'CORE' || /master.*conductor|orchestrat|core|zuri|ai.*twin/.test(combined)) {
    return { category: 'CORE', baseCap: 88, baseTrust: 90, baseSyn: 78, baseAct: 92, baseEvo: 88, baseRisk: 8 };
  }
  if (role === 'CRISIS' || /crisis|compliance.*sentinel|risk/.test(combined)) {
    return { category: 'CRISIS', baseCap: 82, baseTrust: 88, baseSyn: 72, baseAct: 90, baseEvo: 75, baseRisk: 18 };
  }
  if (role === 'BRIDGE' || /bridge|integration|connect|concierge|front.?desk/.test(combined)) {
    return { category: 'BRIDGE', baseCap: 75, baseTrust: 82, baseSyn: 85, baseAct: 85, baseEvo: 72, baseRisk: 12 };
  }
  if (role === 'UTILITY' || /utility|worker|generator|engine/.test(combined)) {
    return { category: 'UTILITY', baseCap: 70, baseTrust: 72, baseSyn: 68, baseAct: 75, baseEvo: 65, baseRisk: 10 };
  }
  if (role === 'CROSS_SYSTEM' || /cross.?system|omnigrid|hub|router/.test(combined)) {
    return { category: 'CROSS_SYSTEM', baseCap: 80, baseTrust: 78, baseSyn: 88, baseAct: 82, baseEvo: 80, baseRisk: 12 };
  }

  // Sales & marketing agents
  if (/sales|marketing|lead|outreach|nurture|audience.*growth|conversion/.test(combined)) {
    return { category: 'SALES', baseCap: 76, baseTrust: 72, baseSyn: 82, baseAct: 88, baseEvo: 70, baseRisk: 15 };
  }

  // Client-facing / relationship
  if (/client.*relation|vip|guest.*experience|guest.*insight|retention|loyalty|wellness/.test(combined)) {
    return { category: 'CLIENT', baseCap: 72, baseTrust: 80, baseSyn: 84, baseAct: 82, baseEvo: 72, baseRisk: 8 };
  }

  // Operations
  if (/operation|orchestrat|sentinel|coordinat|workforce|onboard|schedul/.test(combined)) {
    return { category: 'OPS', baseCap: 74, baseTrust: 78, baseSyn: 80, baseAct: 80, baseEvo: 70, baseRisk: 10 };
  }

  // Analytics / intelligence
  if (/analytics|analyst|intelligence|data|research|market.*intel/.test(combined)) {
    return { category: 'ANALYTICS', baseCap: 80, baseTrust: 76, baseSyn: 70, baseAct: 75, baseEvo: 85, baseRisk: 8 };
  }

  // Document / content
  if (/document|content|seo|review|reputation|strategy/.test(combined)) {
    return { category: 'CONTENT', baseCap: 74, baseTrust: 70, baseSyn: 68, baseAct: 70, baseEvo: 78, baseRisk: 10 };
  }

  // Real estate specifics
  if (/real.?estate|property|listing|deal.?room/.test(combined)) {
    return { category: 'REAL_ESTATE', baseCap: 76, baseTrust: 74, baseSyn: 80, baseAct: 82, baseEvo: 72, baseRisk: 12 };
  }

  // Hospitality specific
  if (/hospitality|hotel|med.?spa|treatment|booking/.test(combined)) {
    return { category: 'HOSPITALITY', baseCap: 74, baseTrust: 78, baseSyn: 82, baseAct: 85, baseEvo: 70, baseRisk: 10 };
  }

  // Finance / billing
  if (/billing|revenue|tax|finance|optimizer|forecast/.test(combined)) {
    return { category: 'FINANCE', baseCap: 78, baseTrust: 82, baseSyn: 70, baseAct: 76, baseEvo: 72, baseRisk: 14 };
  }

  // Legal / compliance
  if (/legal|case|compliance|document.*intel|billing.*auto|research.*assoc/.test(combined)) {
    return { category: 'LEGAL', baseCap: 76, baseTrust: 85, baseSyn: 72, baseAct: 78, baseEvo: 74, baseRisk: 12 };
  }

  // HR / talent
  if (/talent|hr|employee|workforce|onboard/.test(combined)) {
    return { category: 'HR', baseCap: 74, baseTrust: 80, baseSyn: 76, baseAct: 78, baseEvo: 72, baseRisk: 10 };
  }

  // Default: VERTICAL
  return { category: 'VERTICAL', baseCap: 72, baseTrust: 75, baseSyn: 76, baseAct: 78, baseEvo: 70, baseRisk: 10 };
}

// Simple hash from string to number (deterministic variation)
function nameHash(name) {
  let h = 0;
  for (let i = 0; i < (name || '').length; i++) {
    h = ((h << 5) - h) + name.charCodeAt(i);
    h = h & h; // Convert to 32-bit int
  }
  return Math.abs(h);
}

function calculateScores(agent) {
  const klass = classifyAgent(agent.agent_name, agent.role_type, agent.agent_id);
  const seed = nameHash(agent.agent_name || agent.agent_id || '');
  const variant = (seed % 21) - 10; // -10 to +10

  // Add small deterministic variation (±5) for uniqueness within category
  const v = () => Math.round((seed % 11) - 5);

  let cap = Math.min(99, Math.max(35, klass.baseCap + v()));
  let trust = Math.min(99, Math.max(35, klass.baseTrust + v()));
  let syn = Math.min(97, Math.max(40, klass.baseSyn + Math.round(v() * 0.8)));
  let act = Math.min(99, Math.max(40, klass.baseAct + Math.round(v() * 0.6)));
  let evo = Math.min(97, Math.max(30, klass.baseEvo + Math.round(v() * 0.7)));
  let risk = Math.min(45, Math.max(3, klass.baseRisk + Math.round(v() * 0.5)));

  // If agent has actual data, use it to adjust
  const role = (agent.role_type || '').toUpperCase();
  const health = (agent.health_status || '').toUpperCase();
  const isSystem = !!agent.is_system_agent;

  if (health === 'ACTIVE') { act = Math.min(99, act + 8); trust = Math.min(99, trust + 5); }
  if (health === 'DEGRADED') { act = Math.max(40, act - 10); trust = Math.max(35, trust - 8); }
  if (isSystem) { cap = Math.min(99, cap + 5); trust = Math.min(99, trust + 5); }

  // Compute MAS formula: 0.25×Cap + 0.20×Trust + 0.20×Syn + 0.15×Act + 0.10×Evo - 0.10×Risk
  const mas = Math.round((0.25 * cap + 0.20 * trust + 0.20 * syn + 0.15 * act + 0.10 * evo - 0.10 * risk) * 100) / 100;

  // Determine status from thresholds
  let status = 'Critical';
  if (mas >= 95) status = 'Elite';
  else if (mas >= 85) status = 'High';
  else if (mas >= 70) status = 'Stable';
  else if (mas >= 55) status = 'Monitor';
  else if (mas >= 40) status = 'Degraded';

  return { capability: cap, trust, synergy: syn, activation: act, evolution: evo, risk, mas, status, category: klass.category };
}

async function run() {
  const pool = new pg.Pool(POOL_CONFIG);
  const client = await pool.connect();

  try {
    console.log('🔌 Connected to database.');

    // 1. Fetch all agents
    const { rows: agents } = await client.query(`
      SELECT agent_id, agent_name, role_type, autonomy_level, authority_level, risk_level,
             health_status, is_system_agent, status, evolution_status
      FROM agents
      WHERE agent_id IS NOT NULL
      ORDER BY agent_name
    `);
    console.log(`📋 Found ${agents.length} agents.`);

    // 2. Calculate scores for each
    const scored = agents.map(a => ({
      ...a,
      scores: calculateScores(a),
    }));

    // 3. Print summary
    console.log('\n📊 Calculated MAS Scores:');
    console.log('─'.repeat(100));
    console.log(
      'Agent ID'.padEnd(32),
      'Name'.padEnd(28),
      'Cap'.padEnd(5),
      'Trust'.padEnd(6),
      'Syn'.padEnd(5),
      'Act'.padEnd(5),
      'Evo'.padEnd(5),
      'Risk'.padEnd(5),
      'MAS'.padEnd(6),
      'Status'
    );
    console.log('─'.repeat(100));

    for (const a of scored) {
      const s = a.scores;
      console.log(
        (a.agent_id || '').padEnd(32),
        (a.agent_name || '').slice(0, 26).padEnd(28),
        String(s.capability).padEnd(5),
        String(s.trust).padEnd(6),
        String(s.synergy).padEnd(5),
        String(s.activation).padEnd(5),
        String(s.evolution).padEnd(5),
        String(s.risk).padEnd(5),
        String(s.mas).padEnd(6),
        s.status
      );
    }

    // 4. Save to evolved_eden_agents table
    console.log('\n💾 Saving MAS scores to evolved_eden_agents table...');

    let upserted = 0;
    let skipped = 0;

    for (const a of scored) {
      const s = a.scores;
      // Check if row exists
      const { rows: existing } = await client.query(
        `SELECT agent_id FROM evolved_eden_agents WHERE agent_id = $1`,
        [a.agent_id]
      );

      if (existing.length > 0) {
        // Update
        await client.query(`
          UPDATE evolved_eden_agents
          SET capability = $1, trust = $2, synergy = $3, activation = $4,
              evolution = $5, risk = $6, updated_at = NOW()
          WHERE agent_id = $7
        `, [s.capability, s.trust, s.synergy, s.activation, s.evolution, s.risk, a.agent_id]);
        upserted++;
      } else {
        // Insert — must include agent_name (NOT NULL)
        await client.query(`
          INSERT INTO evolved_eden_agents (agent_id, agent_name, capability, trust, synergy, activation, evolution, risk, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
        `, [a.agent_id, a.agent_name, s.capability, s.trust, s.synergy, s.activation, s.evolution, s.risk]);
        upserted++;
      }
    }

    console.log(`✅ Saved scores for ${upserted} agents.`);

    // 5. Also save to mas_scores table for the model
    console.log('\n💾 Saving to mas_scores (model) table...');

    let masInserted = 0;
    for (const a of scored) {
      const s = a.scores;
      const componentScores = {
        cap: s.capability,
        tru: s.trust,
        syn: s.synergy,
        act: s.activation,
        evo: s.evolution,
        risk: s.risk,
      };

      await client.query(`
        INSERT INTO public.mas_scores (model_key, agent_id, component_scores, mas, status, notes, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
        ON CONFLICT (agent_id, model_key) DO UPDATE
        SET component_scores = EXCLUDED.component_scores,
            mas = EXCLUDED.mas,
            status = EXCLUDED.status,
            notes = EXCLUDED.notes,
            updated_at = NOW()
      `, [
        'evolved_eden_mas',
        a.agent_id,
        JSON.stringify(componentScores),
        s.mas,
        s.status,
        `Auto-scored: role=${a.role_type || 'unknown'} auto=${a.autonomy_level ?? '?'} auth=${a.authority_level ?? '?'} risk=${a.risk_level ?? '?'} health=${a.health_status || '?'}`,
      ]);
      masInserted++;
    }

    console.log(`✅ Saved ${masInserted} MAS model scores.`);

    // 6. Summary stats
    const statuses = {};
    for (const a of scored) {
      statuses[a.scores.status] = (statuses[a.scores.status] || 0) + 1;
    }
    console.log('\n📈 Distribution:');
    for (const [status, count] of Object.entries(statuses)) {
      console.log(`  ${status}: ${count}`);
    }

    const avgMas = scored.reduce((sum, a) => sum + a.scores.mas, 0) / scored.length;
    console.log(`\n📊 Average MAS: ${Math.round(avgMas * 100) / 100}`);
    console.log('✅ Done!');
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
