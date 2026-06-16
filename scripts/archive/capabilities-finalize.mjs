import pg from 'pg';
const pool = new pg.Pool({
  host: 'db.jebixydqpvsegvrtfmgm.supabase.co', port: 5432, database: 'postgres',
  user: 'postgres', password: process.argv[2],
  ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 15000,
});

// 1. Link remaining 30 unlinked agent_capabilities
const {rows: unlinked} = await pool.query(`
  SELECT c.id, c.capability_key, c.capability_name 
  FROM agent_capabilities c WHERE c.agent_id IS NULL
`);
console.log(`${unlinked.length} unlinked capabilities`);

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

let linked = 0;
for (const cap of unlinked) {
  const agentType = capToAgentType[cap.capability_key] || 'orchestration_agent';
  
  // Find an agent of that type
  const {rows: agents} = await pool.query(
    "SELECT id FROM agents WHERE agent_type = $1 LIMIT 1",
    [agentType]
  );
  
  if (agents.length > 0) {
    await pool.query(
      "UPDATE agent_capabilities SET agent_id = $1, agent_type_key = $2 WHERE id = $3",
      [agents[0].id, agentType, cap.id]
    );
    linked++;
  }
}
console.log(`Linked ${linked} remaining capabilities`);

// 2. Fill workflow_key for all capabilities that are missing it
const {rows: noWf} = await pool.query(`
  SELECT id, capability_key, agent_type_key FROM agent_capabilities WHERE workflow_key IS NULL
`);
console.log(`\n${noWf.length} capabilities missing workflow_key`);

let wfLinked = 0;
for (const cap of noWf) {
  const agentType = cap.agent_type_key || capToAgentType[cap.capability_key] || 'orchestration_agent';
  const wfKey = `${agentType}_workflow`;
  
  await pool.query(
    "UPDATE agent_capabilities SET workflow_key = $1 WHERE id = $2 AND workflow_key IS NULL",
    [wfKey, cap.id]
  );
  wfLinked++;
}
console.log(`Filled workflow_key for ${wfLinked} capabilities`);

// 3. Verify final state
const {rows: final} = await pool.query(`
  SELECT 
    COUNT(*)::int as total,
    COUNT(*) FILTER (WHERE agent_id IS NOT NULL)::int as has_agent,
    COUNT(*) FILTER (WHERE agent_type_key IS NOT NULL)::int as has_type_key,
    COUNT(*) FILTER (WHERE workflow_key IS NOT NULL)::int as has_wf_key
  FROM agent_capabilities
`);
console.log('\nFinal capability state:', JSON.stringify(final[0], null, 2));

await pool.end();
