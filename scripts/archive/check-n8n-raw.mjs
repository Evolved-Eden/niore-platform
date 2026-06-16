import https from 'https';

const N8N_BASE_URL = 'https://automation.evolvededen.com';
const TOKEN = process.env.N8N_MCP_TOKEN;

function jsonRpc(method, params = {}) {
  const url = new URL('/mcp-server/http', N8N_BASE_URL);
  const payload = JSON.stringify({ jsonrpc: '2.0', id: Date.now(), method, params });

  return new Promise((resolve, reject) => {
    const opts = {
      hostname: url.hostname, port: url.port || 443,
      path: url.pathname + url.search, method: 'POST',
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        'Content-Type': 'application/json',
        Accept: 'application/json, text/event-stream',
      },
      rejectUnauthorized: false, timeout: 15000,
    };

    const req = https.request(opts, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        console.log(`Status: ${res.statusCode}`);
        console.log(`Headers:`, res.headers);
        console.log(`Raw response (first 500 chars):`, data.slice(0, 500));
        try {
          const json = JSON.parse(data);
          console.log(`\nParsed:`, JSON.stringify(json, null, 2).slice(0, 1000));
        } catch {
          console.log(`\nNot JSON - likely SSE stream`);
          // Maybe it's SSE, check first line
          const lines = data.split('\n').filter(Boolean);
          console.log(`Lines: ${lines.length}`);
          lines.slice(0, 5).forEach((l, i) => console.log(`  [${i}] ${l.slice(0, 200)}`));
        }
        resolve(data);
      });
    });

    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
    req.write(payload);
    req.end();
  });
}

// Also try the REST API directly
function restGet(path) {
  const url = new URL(path, N8N_BASE_URL);
  return new Promise((resolve) => {
    const req = https.get(url.toString(), {
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        'X-N8N-API-KEY': TOKEN,
      },
      rejectUnauthorized: false,
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        console.log(`\n=== REST GET ${path} ===`);
        console.log(`Status: ${res.statusCode}`);
        console.log(`Body (first 300):`, data.slice(0, 300));
        resolve();
      });
    });
    req.on('error', (e) => console.error('REST error:', e.message));
  });
}

async function main() {
  console.log(`Testing with N8N_MCP_TOKEN: ${TOKEN ? TOKEN.slice(0, 20) + '...' : 'NOT SET'}\n`);
  
  // Try tools/list
  console.log('=== tools/list ===');
  await jsonRpc('tools/list');
  
  // Try REST health check
  await restGet('/rest/health');
  await restGet('/rest/workflows?limit=3');
}

main().catch(console.error);
