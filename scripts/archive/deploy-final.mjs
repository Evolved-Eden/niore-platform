/**
 * Deploy ALL 5 n8n workflows with correct SDK patterns
 * Run: node scripts/deploy-final.mjs
 */
import https from "https";
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const TOKEN = process.env.N8N_MCP_TOKEN;
if (!TOKEN) { console.error("❌ N8N_MCP_TOKEN not set"); process.exit(1); }

function rpc(method, params) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ jsonrpc: "2.0", id: Date.now(), method, params });
    const opts = {
      hostname: "automation.evolvededen.com", port: 443,
      path: "/mcp-server/http", method: "POST",
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

// ═══════════════════════════════════════════════════════════════
// Build each workflow as an array of lines (no escaping headaches)
// ═══════════════════════════════════════════════════════════════

function joinLines(lines) {
  return lines.join("\n");
}

const WF1 = joinLines([
  `import { workflow, node, trigger, ifElse, newCredential, expr } from '@n8n/workflow-sdk';`,
  ``,
  `const wf1Trigger = trigger({`,
  `  type: 'n8n-nodes-base.scheduleTrigger',`,
  `  version: 1.1,`,
  `  config: { name: 'Every 5s', parameters: { rule: { interval: [{ seconds: 5 }] } }, position: [250, 300] },`,
  `  output: [{}]`,
  `});`,
  ``,
  `const countPending = node({`,
  `  type: 'n8n-nodes-base.postgres',`,
  `  version: 2,`,
  `  config: {`,
  `    name: 'Count Pending',`,
  `    parameters: {`,
  `      operation: 'executeQuery',`,
  `      query: "SELECT COUNT(*)::int AS pending_count\\nFROM public.workflow_jobs\\nWHERE status = 'pending';"`,
  `    },`,
  `    credentials: { postgres: newCredential('Postgres account') },`,
  `    position: [450, 300]`,
  `  },`,
  `  output: [{ pending_count: 0 }]`,
  `});`,
  ``,
  `const hasWork = ifElse({`,
  `  version: 2.2,`,
  `  config: {`,
  `    name: 'Has Work?',`,
  `    parameters: {`,
  `      conditions: {`,
  `        options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' },`,
  `        conditions: [{ id: 'condition-1', leftValue: expr('{{ $json.pending_count }}'), rightValue: '=0', operator: { type: 'number', operation: 'larger' } }],`,
  `        combinator: 'and'`,
  `      }`,
  `    },`,
  `    position: [650, 300]`,
  `  }`,
  `});`,
  ``,
  `const callWorker = node({`,
  `  type: 'n8n-nodes-base.httpRequest',`,
  `  version: 4.2,`,
  `  config: {`,
  `    name: 'Call Worker',`,
  `    parameters: {`,
  `      method: 'POST',`,
  `      url: 'https://jebixydqpvsegvrtfmgm.supabase.co/functions/v1/workflow-worker',`,
  `      authentication: 'predefinedCredentialType',`,
  `      nodeCredentialType: 'httpHeaderAuth',`,
  `      sendHeaders: true,`,
  `      headerParameters: { parameters: [{ name: 'Authorization', value: expr('Bearer {{ $env.SUPABASE_SERVICE_ROLE_KEY }}') }, { name: 'Content-Type', value: 'application/json' }] },`,
  `      sendBody: true,`,
  `      specifyBody: 'json',`,
  `      jsonBody: '{}',`,
  `      options: { timeout: 30000, allowUnauthorizedCerts: false }`,
  `    },`,
  `    onError: 'continueErrorOutput',`,
  `    position: [850, 200]`,
  `  },`,
  `  output: [{ status: 'ok' }]`,
  `});`,
  ``,
  `const alertFailure = node({`,
  `  type: 'n8n-nodes-base.discord',`,
  `  version: 2,`,
  `  config: {`,
  `    name: 'Alert Failure',`,
  `    parameters: {`,
  `      operation: 'create',`,
  `      name: 'workflow-alerts',`,
  `      text: expr('{{ { "content": "⚠️ **WF1 Queue Poller**\\\\n**Reason:** HTTP call failed\\\\n**Context**: " + JSON.stringify($json) } | toJson() }}')`,
  `    },`,
  `    credentials: { discordWebhook: newCredential('Discord Alerts') },`,
  `    position: [850, 500]`,
  `  },`,
  `  output: [{ notified: true }]`,
  `});`,
  ``,
  `export default workflow('wf1-queue-poller', 'WF1 — Queue Poller')`,
  `  .add(wf1Trigger)`,
  `  .to(countPending)`,
  `  .to(hasWork`,
  `    .onTrue(callWorker.onError(alertFailure))`,
  `    .onFalse()`,
  `  );`,
]);

const WF2 = joinLines([
  `import { workflow, node, trigger, splitInBatches, nextBatch, newCredential, expr } from '@n8n/workflow-sdk';`,
  ``,
  `const wf2Trigger = trigger({`,
  `  type: 'n8n-nodes-base.scheduleTrigger',`,
  `  version: 1.1,`,
  `  config: { name: 'Every 1m', parameters: { rule: { interval: [{ minutes: 1 }] } }, position: [250, 300] },`,
  `  output: [{}]`,
  `});`,
  ``,
  `const fetchDueSchedules = node({`,
  `  type: 'n8n-nodes-base.postgres',`,
  `  version: 2,`,
  `  config: {`,
  `    name: 'Fetch Due Schedules',`,
  `    parameters: {`,
  `      operation: 'executeQuery',`,
  `      query: "SELECT *\\nFROM public.workflow_schedules\\nWHERE active = true\\n  AND next_run_at <= NOW()\\nORDER BY next_run_at\\nLIMIT 500;"`,
  `    },`,
  `    credentials: { postgres: newCredential('Postgres account') },`,
  `    position: [450, 300]`,
  `  },`,
  `  output: [{ workflow_id: '', organization_id: '', payload: {} }]`,
  `});`,
  ``,
  `const splitBatches = splitInBatches({`,
  `  version: 3,`,
  `  config: { name: 'Split Batches', parameters: { batchSize: 50 }, position: [650, 300] }`,
  `});`,
  ``,
  `const triggerWorkflow = node({`,
  `  type: 'n8n-nodes-base.httpRequest',`,
  `  version: 4.2,`,
  `  config: {`,
  `    name: 'Trigger Workflow',`,
  `    parameters: {`,
  `      method: 'POST',`,
  `      url: 'https://jebixydqpvsegvrtfmgm.supabase.co/functions/v1/workflow-trigger',`,
  `      authentication: 'predefinedCredentialType',`,
  `      nodeCredentialType: 'httpHeaderAuth',`,
  `      sendHeaders: true,`,
  `      headerParameters: { parameters: [{ name: 'Authorization', value: expr('Bearer {{ $env.SUPABASE_SERVICE_ROLE_KEY }}') }, { name: 'Content-Type', value: 'application/json' }] },`,
  `      sendBody: true,`,
  `      specifyBody: 'json',`,
  `      jsonBody: expr('{\\n  "workflow_id": "{{ $json.workflow_id }}",\\n  "organization_id": "{{ $json.organization_id }}",\\n  "client_id": "{{ $json.client_id }}",\\n  "business_id": "{{ $json.business_id }}",\\n  "input": "{{ $json.payload }}",\\n  "idempotency_key": "schedule-{{ $json.id }}-{{ $now }}"\\n}'),`,
  `      options: { timeout: 30000, allowUnauthorizedCerts: false }`,
  `    },`,
  `    position: [850, 300]`,
  `  },`,
  `  output: [{ status: 'triggered' }]`,
  `});`,
  ``,
  `const updateSchedule = node({`,
  `  type: 'n8n-nodes-base.postgres',`,
  `  version: 2,`,
  `  config: {`,
  `    name: 'Update Schedule',`,
  `    parameters: {`,
  `      operation: 'executeQuery',`,
  `      query: "UPDATE public.workflow_schedules\\nSET last_run_at = NOW(),\\nnext_run_at = public.calculate_next_run(cron_expression)\\nWHERE id = '{{ $json.id }}'::uuid;"`,
  `    },`,
  `    credentials: { postgres: newCredential('Postgres account') },`,
  `    position: [1050, 300]`,
  `  },`,
  `  output: [{ updated: true }]`,
  `});`,
  ``,
  `export default workflow('wf2-scheduler', 'WF2 — Scheduler')`,
  `  .add(wf2Trigger)`,
  `  .to(fetchDueSchedules)`,
  `  .to(splitBatches`,
  `    .onEachBatch(triggerWorkflow.to(updateSchedule.to(nextBatch(splitBatches))))`,
  `  );`,
]);

const WF3 = joinLines([
  `import { workflow, node, trigger, ifElse, splitInBatches, nextBatch, newCredential, expr } from '@n8n/workflow-sdk';`,
  ``,
  `const wf3Trigger = trigger({`,
  `  type: 'n8n-nodes-base.scheduleTrigger',`,
  `  version: 1.1,`,
  `  config: { name: 'Every 5m', parameters: { rule: { interval: [{ minutes: 5 }] } }, position: [250, 300] },`,
  `  output: [{}]`,
  `});`,
  ``,
  `const fetchDeadLetters = node({`,
  `  type: 'n8n-nodes-base.postgres',`,
  `  version: 2,`,
  `  config: {`,
  `    name: 'Fetch Dead Letters',`,
  `    parameters: {`,
  `      operation: 'executeQuery',`,
  `      query: "SELECT *\\nFROM public.workflow_dead_letters\\nWHERE processed = false\\nORDER BY created_at\\nLIMIT 100;"`,
  `    },`,
  `    credentials: { postgres: newCredential('Postgres account') },`,
  `    position: [450, 300]`,
  `  },`,
  `  output: [{ id: '', workflow_id: '', retryable: false, retry_count: 0, max_retries: 0, payload: {} }]`,
  `});`,
  ``,
  `const splitBatches = splitInBatches({`,
  `  version: 3,`,
  `  config: { name: 'Split Batches', parameters: { batchSize: 25 }, position: [650, 300] }`,
  `});`,
  ``,
  `const retryable = ifElse({`,
  `  version: 2.2,`,
  `  config: {`,
  `    name: 'Retryable?',`,
  `    parameters: {`,
  `      conditions: {`,
  `        options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' },`,
  `        conditions: [` ,
  `          { id: 'condition-1', leftValue: expr('{{ $json.retryable }}'), rightValue: '=true', operator: { type: 'boolean', operation: 'equal' } },`,
  `          { id: 'condition-2', leftValue: expr('{{ $json.retry_count }}'), rightValue: expr('{{ $json.max_retries }}'), operator: { type: 'number', operation: 'smaller' } }`,
  `        ],`,
  `        combinator: 'and'`,
  `      }`,
  `    },`,
  `    position: [850, 300]`,
  `  }`,
  `});`,
  ``,
  `const replayWorkflow = node({`,
  `  type: 'n8n-nodes-base.httpRequest',`,
  `  version: 4.2,`,
  `  config: {`,
  `    name: 'Replay Workflow',`,
  `    parameters: {`,
  `      method: 'POST',`,
  `      url: 'https://jebixydqpvsegvrtfmgm.supabase.co/functions/v1/workflow-trigger',`,
  `      authentication: 'predefinedCredentialType',`,
  `      nodeCredentialType: 'httpHeaderAuth',`,
  `      sendHeaders: true,`,
  `      headerParameters: { parameters: [{ name: 'Authorization', value: expr('Bearer {{ $env.SUPABASE_SERVICE_ROLE_KEY }}') }, { name: 'Content-Type', value: 'application/json' }] },`,
  `      sendBody: true,`,
  `      specifyBody: 'json',`,
  `      jsonBody: expr('{\\n  "workflow_id": "{{ $json.workflow_id }}",\\n  "organization_id": "{{ $json.organization_id }}",\\n  "client_id": "{{ $json.client_id }}",\\n  "business_id": "{{ $json.business_id }}",\\n  "input": "{{ $json.payload }}",\\n  "idempotency_key": "retry-{{ $json.id }}"\\n}'),`,
  `      options: { timeout: 30000, allowUnauthorizedCerts: false }`,
  `    },`,
  `    position: [1050, 150]`,
  `  },`,
  `  output: [{ status: 'replayed' }]`,
  `});`,
  ``,
  `const alertDeadLetter = node({`,
  `  type: 'n8n-nodes-base.discord',`,
  `  version: 2,`,
  `  config: {`,
  `    name: 'Alert Dead Letter',`,
  `    parameters: {`,
  `      operation: 'create',`,
  `      name: 'dead-letter-alerts',`,
  `      text: expr('{{ { "content": "💀 **Dead Letter Alert**\\\\n**ID:** " + $json.id + "\\\\n**Workflow:** " + $json.workflow_id + "\\\\n**Error:** " + $json.error_message + "\\\\n**Retries:** " + $json.retry_count + "/" + $json.max_retries } | toJson() }}')`,
  `    },`,
  `    credentials: { discordWebhook: newCredential('Discord Alerts') },`,
  `    position: [1050, 500]`,
  `  },`,
  `  output: [{ notified: true }]`,
  `});`,
  ``,
  `const markProcessed = node({`,
  `  type: 'n8n-nodes-base.postgres',`,
  `  version: 2,`,
  `  config: {`,
  `    name: 'Mark Processed',`,
  `    parameters: {`,
  `      operation: 'executeQuery',`,
  `      query: "UPDATE public.workflow_dead_letters\\nSET processed = true,\\nprocessed_at = NOW()\\nWHERE id = '{{ $json.id }}'::uuid;"`,
  `    },`,
  `    credentials: { postgres: newCredential('Postgres account') },`,
  `    position: [1250, 300]`,
  `  },`,
  `  output: [{ updated: true }]`,
  `});`,
  ``,
  `export default workflow('wf3-dead-letter-handler', 'WF3 — Dead Letter Handler')`,
  `  .add(wf3Trigger)`,
  `  .to(fetchDeadLetters)`,
  `  .to(splitBatches`,
  `    .onEachBatch(retryable`,
  `      .onTrue(replayWorkflow.to(markProcessed.to(nextBatch(splitBatches))))`,
  `      .onFalse(alertDeadLetter.to(markProcessed.to(nextBatch(splitBatches))))`,
  `    )`,
  `  );`,
]);

const WF4 = joinLines([
  `import { workflow, node, trigger, splitInBatches, nextBatch, newCredential, expr } from '@n8n/workflow-sdk';`,
  ``,
  `const wf4Trigger = trigger({`,
  `  type: 'n8n-nodes-base.scheduleTrigger',`,
  `  version: 1.1,`,
  `  config: { name: 'Every 5m', parameters: { rule: { interval: [{ minutes: 5 }] } }, position: [250, 300] },`,
  `  output: [{}]`,
  `});`,
  ``,
  `const aggregateRuns = node({`,
  `  type: 'n8n-nodes-base.postgres',`,
  `  version: 2,`,
  `  config: {`,
  `    name: 'Aggregate Runs',`,
  `    parameters: {`,
  `      operation: 'executeQuery',`,
  `      query: "SELECT\\n  organization_id,\\n  workflow_id,\\n  COUNT(*)::int AS total_runs,\\n  COUNT(CASE WHEN status = 'completed' THEN 1 END)::int AS completed_runs,\\n  COUNT(CASE WHEN status = 'failed' THEN 1 END)::int AS failed_runs,\\n  AVG(EXTRACT(EPOCH FROM (ended_at - started_at)))::float AS avg_duration\\nFROM public.workflow_runs\\nGROUP BY organization_id, workflow_id;"`,
  `    },`,
  `    credentials: { postgres: newCredential('Postgres account') },`,
  `    position: [450, 300]`,
  `  },`,
  `  output: [{ organization_id: '', workflow_id: '', total_runs: 0, completed_runs: 0, failed_runs: 0, avg_duration: 0 }]`,
  `});`,
  ``,
  `const splitBatches = splitInBatches({`,
  `  version: 3,`,
  `  config: { name: 'Split Batches', parameters: { batchSize: 50 }, position: [650, 300] }`,
  `});`,
  ``,
  `const upsertMetrics = node({`,
  `  type: 'n8n-nodes-base.postgres',`,
  `  version: 2,`,
  `  config: {`,
  `    name: 'Upsert Metrics',`,
  `    parameters: {`,
  `      operation: 'executeQuery',`,
  `      query: "INSERT INTO public.workflow_metrics (organization_id, workflow_id, total_runs, completed_runs, failed_runs, avg_duration, updated_at)\\nVALUES (\\n  '{{ $json.organization_id }}'::uuid,\\n  '{{ $json.workflow_id }}',\\n  {{ $json.total_runs }},\\n  {{ $json.completed_runs }},\\n  {{ $json.failed_runs }},\\n  {{ $json.avg_duration }},\\n  NOW()\\n)\\nON CONFLICT (organization_id, workflow_id)\\nDO UPDATE SET\\n  total_runs = EXCLUDED.total_runs,\\n  completed_runs = EXCLUDED.completed_runs,\\n  failed_runs = EXCLUDED.failed_runs,\\n  avg_duration = EXCLUDED.avg_duration,\\n  updated_at = NOW();"`,
  `    },`,
  `    credentials: { postgres: newCredential('Postgres account') },`,
  `    position: [850, 300]`,
  `  },`,
  `  output: [{ upserted: true }]`,
  `});`,
  ``,
  `const finalize = node({`,
  `  type: 'n8n-nodes-base.noOp',`,
  `  version: 1,`,
  `  config: { name: 'Finalize', parameters: {}, position: [1050, 300] },`,
  `  output: [{ done: true }]`,
  `});`,
  ``,
  `export default workflow('wf4-metrics-aggregator', 'WF4 — Metrics Aggregator')`,
  `  .add(wf4Trigger)`,
  `  .to(aggregateRuns)`,
  `  .to(splitBatches`,
  `    .onEachBatch(upsertMetrics.to(finalize.to(nextBatch(splitBatches))))`,
  `  );`,
]);

const WF5 = joinLines([
  `import { workflow, node, trigger, ifElse, newCredential, expr } from '@n8n/workflow-sdk';`,
  ``,
  `const wf5Trigger = trigger({`,
  `  type: 'n8n-nodes-base.webhook',`,
  `  version: 1.2,`,
  `  config: {`,
  `    name: 'Webhook',`,
  `    parameters: { path: 'replay-workflow', httpMethod: 'POST', responseMode: 'lastNode', options: {} },`,
  `    webhookId: 'replay-workflow',`,
  `    position: [250, 300]`,
  `  },`,
  `  output: [{ workflow_run_id: '', body: {} }]`,
  `});`,
  ``,
  `const loadCheckpoint = node({`,
  `  type: 'n8n-nodes-base.postgres',`,
  `  version: 2,`,
  `  config: {`,
  `    name: 'Load Checkpoint',`,
  `    parameters: {`,
  `      operation: 'executeQuery',`,
  `      query: "SELECT *\\nFROM public.workflow_run_checkpoints\\nWHERE workflow_run_id = '{{ $json.workflow_run_id }}'::uuid\\nORDER BY created_at DESC\\nLIMIT 1;"`,
  `    },`,
  `    credentials: { postgres: newCredential('Postgres account') },`,
  `    position: [450, 300]`,
  `  },`,
  `  output: [{ id: '', workflow_run_id: '', checkpoint_data: {} }]`,
  `});`,
  ``,
  `const hasCheckpoint = ifElse({`,
  `  version: 2.2,`,
  `  config: {`,
  `    name: 'Has Checkpoint?',`,
  `    parameters: {`,
  `      conditions: {`,
  `        options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' },`,
  `        conditions: [{ id: 'condition-1', leftValue: expr('{{ $json.length }}'), rightValue: '=0', operator: { type: 'number', operation: 'larger' } }],`,
  `        combinator: 'and'`,
  `      }`,
  `    },`,
  `    position: [650, 300]`,
  `  }`,
  `});`,
  ``,
  `const replayWf = node({`,
  `  type: 'n8n-nodes-base.httpRequest',`,
  `  version: 4.2,`,
  `  config: {`,
  `    name: 'Replay Workflow',`,
  `    parameters: {`,
  `      method: 'POST',`,
  `      url: 'https://jebixydqpvsegvrtfmgm.supabase.co/functions/v1/workflow-trigger',`,
  `      authentication: 'predefinedCredentialType',`,
  `      nodeCredentialType: 'httpHeaderAuth',`,
  `      sendHeaders: true,`,
  `      headerParameters: { parameters: [{ name: 'Authorization', value: expr('Bearer {{ $env.SUPABASE_SERVICE_ROLE_KEY }}') }, { name: 'Content-Type', value: 'application/json' }] },`,
  `      sendBody: true,`,
  `      specifyBody: 'json',`,
  `      jsonBody: expr('{\\n  "workflow_id": "{{ $json.workflow_id }}",\\n  "organization_id": "{{ $json.organization_id }}",\\n  "client_id": "{{ $json.client_id }}",\\n  "business_id": "{{ $json.business_id }}",\\n  "input": "{{ $json.checkpoint_data }}",\\n  "idempotency_key": "replay-{{ $json.workflow_run_id }}"\\n}'),`,
  `      options: { timeout: 30000, allowUnauthorizedCerts: false }`,
  `    },`,
  `    position: [850, 150]`,
  `  },`,
  `  output: [{ status: 'replayed' }]`,
  `});`,
  ``,
  `const respondSuccess = node({`,
  `  type: 'n8n-nodes-base.respondToWebhook',`,
  `  version: 1.1,`,
  `  config: {`,
  `    name: 'Respond Success',`,
  `    parameters: {`,
  `      respondWith: 'json',`,
  `      responseBody: expr('{{ { "success": true, "message": "Workflow replayed successfully", "workflow_run_id": $json.workflow_run_id, "workflow_id": $json.workflow_id } }}')`,
  `    },`,
  `    position: [1050, 150]`,
  `  },`,
  `  output: [{ responded: true }]`,
  `});`,
  ``,
  `const respondNotFound = node({`,
  `  type: 'n8n-nodes-base.respondToWebhook',`,
  `  version: 1.1,`,
  `  config: {`,
  `    name: 'Respond NotFound',`,
  `    parameters: {`,
  `      respondWith: 'json',`,
  `      responseStatusCode: 404,`,
  `      responseBody: expr('{{ { "success": false, "message": "No checkpoint found for workflow_run_id", "workflow_run_id": $json.workflow_run_id } }}')`,
  `    },`,
  `    position: [850, 500]`,
  `  },`,
  `  output: [{ responded: true }]`,
  `});`,
  ``,
  `export default workflow('wf5-reply-recovery', 'WF5 — Reply Recovery')`,
  `  .add(wf5Trigger)`,
  `  .to(loadCheckpoint)`,
  `  .to(hasCheckpoint`,
  `    .onTrue(replayWf.to(respondSuccess))`,
  `    .onFalse(respondNotFound)`,
  `  );`,
]);

// ═══════════════════════════════════════════════════════════════
// Deploy
// ═══════════════════════════════════════════════════════════════
const WORKFLOWS = [
  { id: 'wf1', code: WF1, name: 'WF1 — Queue Poller',
    desc: 'Polls workflow_jobs every 5s, calls worker edge function, alerts Discord on failure' },
  { id: 'wf2', code: WF2, name: 'WF2 — Scheduler',
    desc: 'Every 1m fetches due schedules from workflow_schedules, triggers edge function, updates next_run_at' },
  { id: 'wf3', code: WF3, name: 'WF3 — Dead Letter Handler',
    desc: 'Every 5m processes workflow_dead_letters, retries retryable ones, alerts Discord for non-retryable' },
  { id: 'wf4', code: WF4, name: 'WF4 — Metrics Aggregator',
    desc: 'Every 5m aggregates workflow_runs metrics into workflow_metrics' },
  { id: 'wf5', code: WF5, name: 'WF5 — Reply Recovery',
    desc: 'Webhook at /replay-workflow, loads checkpoint, replays via edge function or returns 404' },
];

let ok = 0, fail = 0;

for (const wf of WORKFLOWS) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📋 ${wf.name}`);
  console.log(`${'='.repeat(60)}`);

  // Validate
  console.log(`🔍 Validating...`);
  const valResult = await rpc("tools/call", {
    name: "validate_workflow",
    arguments: { code: wf.code }
  });
  const valText = valResult?.result?.content?.[0]?.text || "{}";
  const valJson = JSON.parse(valText);

  if (valJson.error) {
    console.error(`   ❌ Validation error: ${valJson.error}`);
    fail++;
    continue;
  }

  if (valJson.warnings?.length > 0) {
    console.log(`   ⚠️  ${valJson.warnings.length} warnings (non-blocking):`);
    for (const w of valJson.warnings) {
      console.log(`       • ${w.message}`);
    }
  } else {
    console.log(`   ✅ Clean (${valJson.nodeCount} nodes)`);
  }

  // Create
  console.log(`📦 Creating workflow...`);
  const createResult = await rpc("tools/call", {
    name: "create_workflow_from_code",
    arguments: { name: wf.name, description: wf.desc, code: wf.code }
  });
  const createText = createResult?.result?.content?.[0]?.text || "{}";
  const createJson = JSON.parse(createText);

  if (createJson.error) {
    console.error(`   ❌ Create failed: ${createJson.error}`);
    fail++;
    continue;
  }

  ok++;
  console.log(`   ✅ ${createJson.workflowId ? 'ID: ' + createJson.workflowId : 'Created!'}`);
  if (createJson.url) console.log(`   🔗 ${createJson.url}`);
  if (createJson.autoAssignedCredentials?.length) {
    for (const cred of createJson.autoAssignedCredentials) {
      console.log(`   🔑 ${cred.nodeName}: ${cred.credentialName}`);
    }
  }
  if (createJson.note) console.log(`   ℹ️  ${createJson.note}`);

  // Publish
  if (createJson.workflowId) {
    console.log(`📢 Publishing...`);
    const pubResult = await rpc("tools/call", {
      name: "publish_workflow",
      arguments: { workflowId: createJson.workflowId }
    });
    const pubText = pubResult?.result?.content?.[0]?.text || "{}";
    const pubJson = JSON.parse(pubText);
    if (pubJson.activated) {
      console.log(`   ✅ Published & activated!`);
    } else {
      console.log(`   ${pubJson.error ? '❌ Publish failed: ' + pubJson.error : '✅ Published'}`);
    }
  }
}

console.log(`\n${'='.repeat(60)}`);
console.log(`🏁 Done: ${ok} deployed, ${fail} failed`);
console.log(`${'='.repeat(60)}`);
