/**
 * Deploy WF1 — Queue Poller via n8n Workflow SDK
 * Run: node scripts/deploy-wf1.mjs
 */
import https from "https";
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const TOKEN = process.env.N8N_MCP_TOKEN;
if (!TOKEN) { process.exit(1); }

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

// ── WF1 SDK Code ──────────────────────────────────────────────
const code = `
import { workflow, node, trigger, ifElse, newCredential, expr, placeholder } from '@n8n/workflow-sdk';

const scheduleTrigger = trigger({
  type: 'n8n-nodes-base.scheduleTrigger',
  version: 1.1,
  config: {
    name: 'Every 5s',
    parameters: { rule: { interval: 5 } },
    position: [250, 300]
  },
  output: [{}]
});

const countPending = node({
  type: 'n8n-nodes-base.postgres',
  version: 2,
  config: {
    name: 'Count Pending',
    parameters: {
      operation: 'executeQuery',
      query: "SELECT COUNT(*)::int AS pending_count FROM public.workflow_jobs WHERE status = 'pending';"
    },
    credentials: { postgres: newCredential('Supabase Postgres') },
    position: [450, 300]
  },
  output: [{ pending_count: 0 }]
});

const hasWork = ifElse({
  version: 2.2,
  config: {
    name: 'Has Work?',
    parameters: {
      conditions: {
        options: { caseSensitive: true, leftValue: '', typeValidation: 'loose' },
        conditions: [{ leftValue: expr('{{ $json.pending_count }}'), operator: { type: 'number', operation: 'larger' }, rightValue: 0 }],
        combinator: 'and'
      }
    },
    position: [650, 300]
  }
});

const fetchNext = node({
  type: 'n8n-nodes-base.postgres',
  version: 2,
  config: {
    name: 'Fetch Next Job',
    parameters: {
      operation: 'executeQuery',
      query: "SELECT id, payload, job_type, retry_count FROM public.workflow_jobs WHERE status = 'pending' ORDER BY created_at ASC LIMIT 1;"
    },
    credentials: { postgres: newCredential('Supabase Postgres') },
    executeOnce: true,
    position: [850, 200]
  },
  output: [{ id: '', payload: {}, job_type: '', retry_count: 0 }]
});

const processJob = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.3,
  config: {
    name: 'Process Job',
    parameters: {
      method: 'POST',
      url: expr('{{ $json.payload?.callback_url || $json.payload?.webhook_url || placeholder("https://your-app.com/api/jobs/" + $json.id) }}'),
      authentication: 'none',
      sendBody: true,
      bodyContentType: 'json',
      jsonBody: JSON.stringify({ jobId: expr('{{ $json.id }}'), payload: expr('{{ $json.payload }}') })
    },
    position: [1050, 200]
  },
  output: [{ status: 'processed' }]
});

const markDone = node({
  type: 'n8n-nodes-base.postgres',
  version: 2,
  config: {
    name: 'Mark Complete',
    parameters: {
      operation: 'executeQuery',
      query: expr("UPDATE public.workflow_jobs SET status = 'completed', completed_at = NOW(), updated_at = NOW() WHERE id = '" + '{{ $json.id || $json._jobId }}' + "';")
    },
    credentials: { postgres: newCredential('Supabase Postgres') },
    position: [1250, 200]
  },
  output: [{ updated: true }]
});

const logEmpty = node({
  type: 'n8n-nodes-base.noOp',
  version: 1,
  config: {
    name: 'No Work',
    parameters: {},
    position: [1050, 450]
  },
  output: [{ idle: true }]
});

export default workflow('wf1-queue-poller', 'WF1 — Queue Poller')
  .add(scheduleTrigger)
  .to(countPending)
  .to(hasWork
    .onTrue(fetchNext.to(processJob.to(markDone)))
    .onFalse(logEmpty)
  );
`;

async function main() {
  // 1. Validate
  console.log("🔍 Validating WF1 code...");
  const valResult = await rpc("tools/call", {
    name: "validate_workflow",
    arguments: { code }
  });
  const valText = valResult?.result?.content?.[0]?.text || "";
  console.log(`Validation: ${valText.slice(0, 300)}`);

  const valJson = JSON.parse(valText);

  if (valJson.error) {
    console.error(`❌ Validation failed: ${valJson.error}`);
    console.log(`Hint: ${valJson.hint || "none"}`);
    process.exit(1);
  }

  if (!valJson.valid) {
    console.error(`❌ Workflow invalid: ${JSON.stringify(valJson)}`);
    process.exit(1);
  }

  console.log("✅ Validation passed!\n");

  // 2. Create
  console.log("📦 Creating WF1 — Queue Poller...");
  const createResult = await rpc("tools/call", {
    name: "create_workflow_from_code",
    arguments: {
      name: "WF1 — Queue Poller",
      description: "Polls workflow_jobs table every 5 seconds and processes pending items",
      code
    }
  });
  const createText = createResult?.result?.content?.[0]?.text || JSON.stringify(createResult);
  console.log(`Result: ${createText}`);

  const createJson = JSON.parse(createText);
  if (createJson.error) {
    console.error(`❌ Creation failed: ${createJson.error}`);
    process.exit(1);
  }

  console.log(`✅ Workflow created! ID: ${createJson.id || "ok"}`);
}

main().catch(err => { console.error("💥", err.message); process.exit(1); });
