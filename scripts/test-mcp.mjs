// Quick MCP test — run: node --env-file=.env.local scripts/test-mcp.mjs [--insecure]
const INSECURE = process.argv.includes('--insecure') || process.env.N8N_VERIFY_INSECURE === '1';
if (INSECURE) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  console.log('(insecure mode — TLS verification disabled)\n');
}
const N8N_URL = process.env.N8N_BASE_URL || 'https://automation.evolvededen.com';
const MCP_PATH = '/mcp-server/http';
const TOKEN = process.env.N8N_MCP_TOKEN;

async function testMCP() {
  console.log('MCP URL:', N8N_URL + MCP_PATH);
  console.log('Token set:', !!TOKEN);

  // Test 1: tools/list via POST
  console.log('\n--- tools/list (POST) ---');
  try {
    const res = await fetch(N8N_URL + MCP_PATH, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream',
      },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list', params: {} }),
      signal: AbortSignal.timeout(10000),
    });
    console.log('Status:', res.status, res.statusText);
    const text = await res.text();
    console.log('Body:', text.substring(0, 800));
  } catch (e) {
    console.log('Error:', e.message);
  }

  // Test 2: GET the MCP endpoint
  console.log('\n--- GET endpoint ---');
  try {
    const res = await fetch(N8N_URL + MCP_PATH, {
      method: 'GET',
      signal: AbortSignal.timeout(10000),
    });
    console.log('Status:', res.status, res.statusText);
    const text = await res.text();
    console.log('Body:', text.substring(0, 500));
  } catch (e) {
    console.log('Error:', e.message);
  }

  // Test 3: OPTIONS / CORS preflight
  console.log('\n--- OPTIONS endpoint ---');
  try {
    const res = await fetch(N8N_URL + MCP_PATH, {
      method: 'OPTIONS',
      signal: AbortSignal.timeout(10000),
    });
    console.log('Status:', res.status, res.statusText);
    const text = await res.text();
    console.log('Body:', text.substring(0, 500));
  } catch (e) {
    console.log('Error:', e.message);
  }
}

testMCP().catch(console.error);
