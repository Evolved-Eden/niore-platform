/**
 * Deploy ALL n8n workflows from JSON → SDK code
 * Run: node scripts/deploy-all.mjs
 */
import https from "https";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const TOKEN = process.env.N8N_MCP_TOKEN;
if (!TOKEN) { console.error("❌ N8N_MCP_TOKEN not set"); process.exit(1); }

function rpc(method, params) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ jsonrpc: "2.0", id: Date.now(), method, params });
    const opts = {
      hostname: "automation.evolvededen.com",
      port: 443, path: "/mcp-server/http", method: "POST",
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        "Content-Type": "application/json",
        Accept: "application/json, text/event-stream",
      },
      rejectUnauthorized: false, timeout: 30000,
    };
    const req = https.request(opts, (res) => {
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => {
        const m = data.match(/data:\s*(\{[\s\S]*\})/);
        resolve(m ? JSON.parse(m[1]) : { raw: data });
      });
    });
    req.on("error", reject);
    req.on("timeout", () => { req.destroy(); reject(new Error("Timeout")); });
    req.write(body);
    req.end();
  });
}

// ── WF2 — Scheduler ──────────────────────────────────────────
const wf2Code = `
import { workflow, node, trigger, newCredential, expr } from '@n8n/workflow-sdk';

const dailyTrigger = trigger({
  type: 'n8n-nodes-base.scheduleTrigger',
  version: 1.1,
  config: {
    name: 'Daily at 6am',
    parameters: { rule: { hour: 6, minute: 0 } },
    position: [250, 300]
  },
  output: [{}]
});

const fetchExpiring = node({
  type: 'n8n-nodes-base.postgres',
  version: 2,
  config: {
    name: 'Fetch Expiring Items',
    parameters: {
      operation: 'executeQuery',
      query: "SELECT id, title, due_date, entity_type FROM public.workflow_jobs WHERE status = 'scheduled' AND due_date <= NOW() + INTERVAL '1 day' ORDER BY due_date ASC LIMIT 50;"
    },
    credentials: { postgres: newCredential('Postgres account') },
    position: [450, 300]
  },
  output: [{ id: '', title: '', due_date: '', entity_type: '' }]
});

export default workflow('wf2-scheduler', 'WF2 — Scheduler')
  .add(dailyTrigger)
  .to(fetchExpiring);
`;

// ── WF3 — Dead Letter Handler ────────────────────────────────
const wf3Code = `
import { workflow, node, trigger, ifElse, newCredential, expr } from '@n8n/workflow-sdk';

const hourlyTrigger = trigger({
  type: 'n8n-nodes-base.scheduleTrigger',
  version: 1.1,
  config: {
    name: 'Every Hour',
    parameters: { rule: { interval: 60 } },
    position: [250, 300]
  },
  output: [{}]
});

const fetchFailed = node({
  type: 'n8n-nodes-base.postgres',
  version: 2,
  config: {
    name: 'Fetch Failed Jobs',
    parameters: {
      operation: 'executeQuery',
      query: "SELECT id, payload, error_log, retry_count FROM public.workflow_jobs WHERE status = 'failed' AND retry_count < 3 ORDER BY updated_at ASC LIMIT 20;"
    },
    credentials: { postgres: newCredential('Postgres account') },
    position: [450, 300]
  },
  output: [{ id: '', payload: {}, error_log: '', retry_count: 0 }]
});

export default workflow('wf3-dead-letter-handler', 'WF3 — Dead Letter Handler')
  .add(hourlyTrigger)
  .to(fetchFailed);
`;

// ── WF4 — Metrics Aggregator ─────────────────────────────────
const wf4Code = `
import { workflow, node, trigger, newCredential, expr } from '@n8n/workflow-sdk';

const dailyTrigger = trigger({
  type: 'n8n-nodes-base.scheduleTrigger',
  version: 1.1,
  config: {
    name: 'Daily at midnight',
    parameters: { rule: { hour: 0, minute: 5 } },
    position: [250, 300]
  },
  output: [{}]
});

const aggregateMetrics = node({
  type: 'n8n-nodes-base.postgres',
  version: 2,
  config: {
    name: 'Aggregate Metrics',
    parameters: {
      operation: 'executeQuery',
      query: "SELECT DATE(created_at) AS day, job_type, status, COUNT(*) AS count FROM public.workflow_jobs WHERE created_at >= NOW() - INTERVAL '30 days' GROUP BY DATE(created_at), job_type, status ORDER BY day DESC;"
    },
    credentials: { postgres: newCredential('Postgres account') },
    position: [450, 300]
  },
  output: [{ day: '', job_type: '', status: '', count: 0 }]
});

export default workflow('wf4-metrics-aggregator', 'WF4 — Metrics Aggregator')
  .add(dailyTrigger)
  .to(aggregateMetrics);
`;

// ── WF5 — Reply Recovery ─────────────────────────────────────
const wf5Code = `
import { workflow, node, trigger, newCredential, expr } from '@n8n/workflow-sdk';

const hourlyTrigger = trigger({
  type: 'n8n-nodes-base.scheduleTrigger',
  version: 1.1,
  config: {
    name: 'Every 15 min',
    parameters: { rule: { interval: 15 } },
    position: [250, 300]
  },
  output: [{}]
});

const findStale = node({
  type: 'n8n-nodes-base.postgres',
  version: 2,
  config: {
    name: 'Find Stale Executions',
    parameters: {
      operation: 'executeQuery',
      query: "SELECT id, job_type, payload, created_at FROM public.workflow_jobs WHERE status = 'processing' AND updated_at < NOW() - INTERVAL '30 minutes' LIMIT 50;"
    },
    credentials: { postgres: newCredential('Postgres account') },
    position: [450, 300]
  },
  output: [{ id: '', job_type: '', payload: {}, created_at: '' }]
});

export default workflow('wf5-reply-recovery', 'WF5 — Reply Recovery')
  .add(hourlyTrigger)
  .to(findStale);
`;

const WORKFLOWS = [
  { code: wf2Code, name: 'WF2 — Scheduler', desc: 'Daily scheduler for expiring and due items' },
  { code: wf3Code, name: 'WF3 — Dead Letter Handler', desc: 'Hourly retry of failed jobs (up to 3 retries)' },
  { code: wf4Code, name: 'WF4 — Metrics Aggregator', desc: 'Daily aggregation of workflow metrics over 30 days' },
  { code: wf5Code, name: 'WF5 — Reply Recovery', desc: 'Every 15 min recovery of stale processing jobs' },
];

async function deploy(wf) {
  console.log(`\n🔍 Validating ${wf.name}...`);
  const valResult = await rpc("tools/call", {
    name: "validate_workflow",
    arguments: { code: wf.code }
  });
  const valText = valResult?.result?.content?.[0]?.text || "{}";
  const valJson = JSON.parse(valText);

  if (valJson.error || !valJson.valid) {
    console.error(`   ❌ Validation failed: ${valJson.error || valJson.message || "invalid"}`);
    return false;
  }
  console.log(`   ✅ Valid (${valJson.nodeCount} nodes)`);

  console.log(`📦 Creating ${wf.name}...`);
  const createResult = await rpc("tools/call", {
    name: "create_workflow_from_code",
    arguments: { name: wf.name, description: wf.desc, code: wf.code }
  });
  const createText = createResult?.result?.content?.[0]?.text || "{}";
  const createJson = JSON.parse(createText);

  if (createJson.error) {
    console.error(`   ❌ Creation failed: ${createJson.error}`);
    return false;
  }
  console.log(`   ✅ Created! ID: ${createJson.workflowId || createJson.id || "ok"}`);
  console.log(`   🔗 ${createJson.url || "(no URL)"}`);
  return true;
}

async function main() {
  console.log("🚀 Deploying all n8n workflows...\n");
  let ok = 0, fail = 0;
  for (const wf of WORKFLOWS) {
    if (await deploy(wf)) ok++; else fail++;
  }
  console.log(`\n✨ Done: ${ok} deployed, ${fail} failed`);
}

main().catch(err => { console.error("💥", err.message); process.exit(1); });
