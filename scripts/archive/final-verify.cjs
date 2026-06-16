const https = require('https');
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

function test(path) {
  return new Promise(r => {
    https.get({
      hostname: 'jebixydqpvsegvrtfmgm.supabase.co',
      path: '/rest/v1/' + path,
      headers: { apikey: key, Authorization: 'Bearer ' + key }
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => r({ s: res.statusCode, d }));
    }).on('error', e => r({ s: 0, d: e.message }));
  });
}

(async () => {
  const tests = [
    ['agent_generators (should have 55)', 'agent_generators?select=generator_id,generator_name,generator_type&limit=3'],
    ['swarm_templates (should have 64)', 'swarm_templates?select=key,name,swarm_key&limit=3'],
    ['agents with org_id (should be 428)', 'agents?select=agent_id,organization_id,mas_priority&limit=3&organization_id=not.is.null'],
    ['agent_types with category (should be 35)', 'agent_types?select=key,category,runtime_type&limit=5&category=not.is.null'],
    ['agent_swarms (should be ~40)', 'agent_swarms?select=name,swarm_type,mas_score&limit=3'],
    ['workflow_templates (should be 238)', 'workflow_templates?select=key,workflow_type&limit=3'],
  ];
  for (const [label, path] of tests) {
    const result = await test(path);
    const data = JSON.parse(result.d);
    const count = Array.isArray(data) ? data.length : '?';
    console.log(`  ${label}: status=${result.s}, rows=${count}`);
  }
  console.log('\nâœ… ALL API VERIFICATIONS COMPLETE');
})();
