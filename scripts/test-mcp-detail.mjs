import 'dotenv/config';
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const BASE = 'https://automation.evolvededen.com';
const tok = process.env.N8N_MCP_TOKEN;

console.log('Token:', tok ? tok.slice(0, 30) + '...' : 'NOT SET');
console.log('');

// Test 1: Bearer auth
console.log('--- Test 1: Bearer auth /mcp-server/http ---');
try {
  const r1 = await fetch(BASE + '/mcp-server/http', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + tok },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list' }),
    signal: AbortSignal.timeout(10000)
  });
  console.log('Status:', r1.status);
  console.log('Body:', await r1.text());
} catch (e) {
  console.log('Error:', e.message);
}

console.log('');

// Test 2: GET /mcp-server/
console.log('--- Test 2: GET /mcp-server/ ---');
try {
  const r2 = await fetch(BASE + '/mcp-server/', { signal: AbortSignal.timeout(5000) });
  console.log('Status:', r2.status);
  console.log('Body:', (await r2.text()).slice(0, 300));
} catch (e) {
  console.log('Error:', e.message);
}

console.log('');

// Test 3: POST with MCP Access Token format (X-N8N-MCP-TOKEN header)
console.log('--- Test 3: X-N8N-MCP-TOKEN header ---');
try {
  const r3 = await fetch(BASE + '/mcp-server/http', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-N8N-MCP-TOKEN': tok },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list' }),
    signal: AbortSignal.timeout(10000)
  });
  console.log('Status:', r3.status);
  console.log('Body:', await r3.text());
} catch (e) {
  console.log('Error:', e.message);
}

console.log('');

// Test 4: Check if there's a /rest/mcp endpoint
console.log('--- Test 4: GET /rest/mcp ---');
try {
  const r4 = await fetch(BASE + '/rest/mcp', { signal: AbortSignal.timeout(5000) });
  console.log('Status:', r4.status);
  console.log('Body:', (await r4.text()).slice(0, 300));
} catch (e) {
  console.log('Error:', e.message);
}
