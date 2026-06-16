// ============================================================
// Verify n8n connectivity from production env
//   - Tests automation.evolvededen.com reachability
//   - Hits /healthz, /rest/login, MCP endpoint
//   - Confirms credentials work
// Usage: node --env-file=.env.local scripts/verify-n8n.mjs
// ============================================================

const N8N_URL =
  process.env.N8N_URL ||
  process.env.N8N_BASE_URL ||
  process.env.N8N_PUBLIC_API_URL ||
  'https://automation.evolvededen.com'

const N8N_MCP_TOKEN = process.env.N8N_MCP_TOKEN
const N8N_API_KEY = process.env.N8N_PUBLIC_API_KEY || process.env.N8N_API_KEY

console.log('========================================')
console.log(' N8N CONNECTIVITY VERIFICATION')
console.log('========================================')
console.log(`Target: ${N8N_URL}`)
console.log()

// Allow self-signed / private-CA certs for connectivity testing.
// Production should install a trusted cert; this script's job is to diagnose.
const insecure = process.argv.includes('--insecure') || process.env.N8N_VERIFY_INSECURE === '1'
if (insecure) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
  console.log('  (insecure mode — TLS verification disabled for this run)\n')
}
const fetchOpts = {}

async function check(name, url, opts = {}) {
  process.stdout.write(`  ${name.padEnd(30)} `)
  try {
    const res = await fetch(url, { ...fetchOpts, ...opts, signal: AbortSignal.timeout(10_000) })
    const status = res.status
    const ok = status < 500
    console.log(`${ok ? '✅' : '⚠️ '} HTTP ${status}`)
    return { ok: res.ok, status }
  } catch (e) {
    console.log(`❌ ${e.message}`)
    return { ok: false, error: e.message }
  }
}

// ── 1. Health endpoint ─────────────────────────────────────
await check('/healthz', `${N8N_URL}/healthz`)

// ── 2. n8n root ────────────────────────────────────────────
await check('/', `${N8N_URL}/`)

// ── 3. REST API (auth required) ────────────────────────────
await check('/rest/login (no auth)', `${N8N_URL}/rest/login`)

// ── 4. Public API (if API key set) ─────────────────────────
if (N8N_API_KEY) {
  await check('/api/v1/workflows', `${N8N_URL}/api/v1/workflows`, {
    headers: { 'X-N8N-API-KEY': N8N_API_KEY },
  })
} else {
  console.log('  /api/v1/workflows               ⏭️  N8N_PUBLIC_API_KEY not set; skipping')
}

// ── 5. MCP endpoint (if token set) ─────────────────────────
if (N8N_MCP_TOKEN) {
  const mcpRes = await check('MCP /mcp-server/http', `${N8N_URL}/mcp-server/http`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${N8N_MCP_TOKEN}`,
      'Content-Type': 'application/json',
      Accept: 'application/json, text/event-stream',
    },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list', params: {} }),
  })
  if (mcpRes.ok) {
    console.log('  ✅ MCP authentication successful')
  }
} else {
  console.log('  MCP                             ⏭️  N8N_MCP_TOKEN not set; skipping')
}

console.log()
console.log('========================================')
console.log(' Configuration summary')
console.log('========================================')
console.log(`  N8N_URL              = ${process.env.N8N_URL || '(unset)'}`)
console.log(`  N8N_BASE_URL         = ${process.env.N8N_BASE_URL || '(unset)'}`)
console.log(`  N8N_PUBLIC_API_URL   = ${process.env.N8N_PUBLIC_API_URL || '(unset)'}`)
console.log(`  N8N_MCP_URL          = ${process.env.N8N_MCP_URL || '(unset)'}`)
console.log(`  N8N_MCP_TOKEN        = ${N8N_MCP_TOKEN ? '✅ set' : '❌ unset'}`)
console.log(`  N8N_PUBLIC_API_KEY   = ${N8N_API_KEY ? '✅ set' : '❌ unset'}`)
console.log()
