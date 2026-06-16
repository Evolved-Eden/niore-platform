/**
 * Deploy ALL n8n workflows properly — matching original JSON exactly
 * Run: node scripts/deploy-proper.mjs
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
// WF1 — Queue Poller
// ═══════════════════════════════════════════════════════════════
const wf1Code = `
import { workflow, node, trigger, ifElse, newCredential, expr } from '@n8n/workflow-sdk';

const every5s = trigger({
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
      query: "SELECT COUNT(*)::int AS pending_count\\nFROM public.workflow_jobs\\nWHERE status = 'pending';"
    },
    credentials: { postgres: newCredential('Postgres account') },
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
        options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' },
        conditions: [
          { id: 'condition-1', leftValue: expr('{{ $json.pending_count }}'), rightValue: '=0', operator: { type: 'number', operation: 'larger' } }
        ],
        combinator: 'and'
      }
    },
    position: [650, 300]
  }
});

const callWorker = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.2,
  config: {
    name: 'Call Worker',
    parameters: {
      method: 'POST',
      url: 'https://jebixydqpvsegvrtfmgm.supabase.co/functions/v1/workflow-worker',
      authentication: 'genericCredentialType',
      nodeCredentialType: 'httpHeaderAuth',
      sendHeaders: true,
      headerParameters: {
        parameters: [
          { name: 'Authorization', value: expr('Bearer {{ $env.SUPABASE_SERVICE_ROLE_KEY }}') },
          { name: 'Content-Type', value: 'application/json' }
        ]
      },
      sendBody: true,
      specifyBody: 'json',
      jsonBody: '{}',
      options: { timeout: 30000, allowUnauthorizedCerts: false }
    },
    onError: 'continueErrorOutput',
    position: [850, 200]
  },
  output: [{ status: 'ok' }]
});

const alertFailure = node({
  type: 'n8n-nodes-base.discord',
  version: 2,
  config: {
    name: 'Alert Failure',
    parameters: {
      text: expr('{{ {\\n  "content": "⚠️ **WF1 Queue Poller**\\\\n**Reason:** HTTP call failed\\\\n**Context**: " + JSON.stringify($json)\\n} | toJson() }}')
    },
    credentials: { discordWebhook: newCredential('Discord Alerts') },
    position: [850, 500]
  },
  output: [{ notified: true }]
});

export default workflow('wf1-queue-poller', 'WF1 — Queue Poller')
  .add(every5s)
  .to(countPending)
  .to(hasWork
    .onTrue(callWorker)
    .onFalse()
  )
  .add(callWorker.onError(alertFailure));
`;

// ═══════════════════════════════════════════════════════════════
// WF2 — Scheduler
// ═══════════════════════════════════════════════════════════════
const wf2Code = `
import { workflow, node, trigger, splitInBatches, nextBatch, newCredential, expr } from '@n8n/workflow-sdk';

const every1m = trigger({
  type: 'n8n-nodes-base.scheduleTrigger',
  version: 1.1,
  config: {
    name: 'Every 1m',
    parameters: { rule: { interval: 1 } },
    position: [250, 300]
  },
  output: [{}]
});

const fetchDueSchedules = node({
  type: 'n8n-nodes-base.postgres',
  version: 2,
  config: {
    name: 'Fetch Due Schedules',
    parameters: {
      operation: 'executeQuery',
      query: "SELECT *\\nFROM public.workflow_schedules\\nWHERE active = true\\n  AND next_run_at <= NOW()\\nORDER BY next_run_at\\nLIMIT 500;"
    },
    credentials: { postgres: newCredential('Postgres account') },
    position: [450, 300]
  },
  output: [{ workflow_id: '', organization_id: '', payload: {} }]
});

const sib = splitInBatches({
  version: 3,
  config: { name: 'Split Batches', parameters: { batchSize: 50, options: {} }, position: [650, 300] }
});

const triggerWorkflow = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.2,
  config: {
    name: 'Trigger Workflow',
    parameters: {
      method: 'POST',
      url: 'https://jebixydqpvsegvrtfmgm.supabase.co/functions/v1/workflow-trigger',
      authentication: 'genericCredentialType',
      nodeCredentialType: 'httpHeaderAuth',
      sendHeaders: true,
      headerParameters: {
        parameters: [
          { name: 'Authorization', value: expr('Bearer {{ $env.SUPABASE_SERVICE_ROLE_KEY }}') },
          { name: 'Content-Type', value: 'application/json' }
        ]
      },
      sendBody: true,
      specifyBody: 'json',
      jsonBody: expr('{\\n  "workflow_id": "{{ $json.workflow_id }}",\\n  "organization_id": "{{ $json.organization_id }}",\\n  "client_id": "{{ $json.client_id }}",\\n  "business_id": "{{ $json.business_id }}",\\n  "input": "{{ $json.payload }}",\\n  "idempotency_key": "schedule-{{ $json.id }}-{{ $now }}"\\n}'),
      options: { timeout: 30000, allowUnauthorizedCerts: false }
    },
    position: [850, 300]
  },
  output: [{ status: 'triggered' }]
});

const updateSchedule = node({
  type: 'n8n-nodes-base.postgres',
  version: 2,
  config: {
    name: 'Update Schedule',
    parameters: {
      operation: 'executeQuery',
      query: "UPDATE public.workflow_schedules\\nSET\\n  last_run_at = NOW(),\\n  next_run_at = public.calculate_next_run(cron_expression)\\nWHERE id = '{{ $json.id }}'::uuid;"
    },
    credentials: { postgres: newCredential('Postgres account') },
    position: [1050, 300]
  },
  output: [{ updated: true }]
});

export default workflow('wf2-scheduler', 'WF2 — Scheduler')
  .add(every1m)
  .to(fetchDueSchedules)
  .to(sib
    .onEachBatch(triggerWorkflow.to(updateSchedule.to(nextBatch(sib))))
  );
`;

// ═══════════════════════════════════════════════════════════════
// WF3 — Dead Letter Handler
// ═══════════════════════════════════════════════════════════════
const wf3Code = `
import { workflow, node, trigger, ifElse, splitInBatches, nextBatch, newCredential, expr } from '@n8n/workflow-sdk';

const every5m = trigger({
  type: 'n8n-nodes-base.scheduleTrigger',
  version: 1.1,
  config: {
    name: 'Every 5m',
    parameters: { rule: { interval: 5 } },
    position: [250, 300]
  },
  output: [{}]
});

const fetchDeadLetters = node({
  type: 'n8n-nodes-base.postgres',
  version: 2,
  config: {
    name: 'Fetch Dead Letters',
    parameters: {
      operation: 'executeQuery',
      query: "SELECT *\\nFROM public.workflow_dead_letters\\nWHERE processed = false\\nORDER BY created_at\\nLIMIT 100;"
    },
    credentials: { postgres: newCredential('Postgres account') },
    position: [450, 300]
  },
  output: [{ id: '', workflow_id: '', retryable: false, retry_count: 0, max_retries: 0, payload: {} }]
});

const sib = splitInBatches({
  version: 3,
  config: { name: 'Split Batches', parameters: { batchSize: 25, options: {} }, position: [650, 300] }
});

const retryable = ifElse({
  version: 2.2,
  config: {
    name: 'Retryable?',
    parameters: {
      conditions: {
        options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' },
        conditions: [
          { id: 'condition-1', leftValue: expr('{{ $json.retryable }}'), rightValue: '=true', operator: { type: 'boolean', operation: 'equal' } },
          { id: 'condition-2', leftValue: expr('{{ $json.retry_count }}'), rightValue: expr('{{ $json.max_retries }}'), operator: { type: 'number', operation: 'smaller' } }
        ],
        combinator: 'and'
      }
    },
    position: [850, 300]
  }
});

const replayWorkflow = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.2,
  config: {
    name: 'Replay Workflow',
    parameters: {
      method: 'POST',
      url: 'https://jebixydqpvsegvrtfmgm.supabase.co/functions/v1/workflow-trigger',
      authentication: 'genericCredentialType',
      nodeCredentialType: 'httpHeaderAuth',
      sendHeaders: true,
      headerParameters: {
        parameters: [
          { name: 'Authorization', value: expr('Bearer {{ $env.SUPABASE_SERVICE_ROLE_KEY }}') },
          { name: 'Content-Type', value: 'application/json' }
        ]
      },
      sendBody: true,
      specifyBody: 'json',
      jsonBody: expr('{\\n  "workflow_id": "{{ $json.workflow_id }}",\\n  "organization_id": "{{ $json.organization_id }}",\\n  "client_id": "{{ $json.client_id }}",\\n  "business_id": "{{ $json.business_id }}",\\n  "input": "{{ $json.payload }}",\\n  "idempotency_key": "retry-{{ $json.id }}"\\n}'),
      options: { timeout: 30000, allowUnauthorizedCerts: false }
    },
    position: [1050, 150]
  },
  output: [{ status: 'replayed' }]
});

const alertDeadLetter = node({
  type: 'n8n-nodes-base.discord',
  version: 2,
  config: {
    name: 'Alert Dead Letter',
    parameters: {
      text: expr('{{ {\\n  "content": "💀 **Dead Letter Alert**\\\\n**ID:** " + $json.id + "\\\\n**Workflow:** " + $json.workflow_id + "\\\\n**Error:** " + ($json.error_message || "Unknown") + "\\\\n**Retries:** " + $json.retry_count + "/" + $json.max_retries\\n} | toJson() }}')
    },
    credentials: { discordWebhook: newCredential('Discord Alerts') },
    position: [1050, 500]
  },
  output: [{ notified: true }]
});

const markProcessed = node({
  type: 'n8n-nodes-base.postgres',
  version: 2,
  config: {
    name: 'Mark Processed',
    parameters: {
      operation: 'executeQuery',
      query: "UPDATE public.workflow_dead_letters\\nSET\\n  processed = true,\\n  processed_at = NOW()\\nWHERE id = '{{ $json.id }}'::uuid;"
    },
    credentials: { postgres: newCredential('Postgres account') },
    position: [1250, 300]
  },
  output: [{ updated: true }]
});

export default workflow('wf3-dead-letter-handler', 'WF3 — Dead Letter Handler')
  .add(every5m)
  .to(fetchDeadLetters)
  .to(sib
    .onEachBatch(retryable
      .onTrue(replayWorkflow.to(markProcessed.to(nextBatch(sib))))
      .onFalse(alertDeadLetter.to(markProcessed.to(nextBatch(sib))))
    )
  );
`;

// ═══════════════════════════════════════════════════════════════
// WF4 — Metrics Aggregator
// ═══════════════════════════════════════════════════════════════
const wf4Code = `
import { workflow, node, trigger, splitInBatches, nextBatch, newCredential, expr } from '@n8n/workflow-sdk';

const every5m = trigger({
  type: 'n8n-nodes-base.scheduleTrigger',
  version: 1.1,
  config: {
    name: 'Every 5m',
    parameters: { rule: { interval: 5 } },
    position: [250, 300]
  },
  output: [{}]
});

const aggregateRuns = node({
  type: 'n8n-nodes-base.postgres',
  version: 2,
  config: {
    name: 'Aggregate Runs',
    parameters: {
      operation: 'executeQuery',
      query: "SELECT\\n  organization_id,\\n  workflow_id,\\n  COUNT(*)::int AS total_runs,\\n  COUNT(CASE WHEN status = 'completed' THEN 1 END)::int AS completed_runs,\\n  COUNT(CASE WHEN status = 'failed' THEN 1 END)::int AS failed_runs,\\n  AVG(EXTRACT(EPOCH FROM (ended_at - started_at))) AS avg_duration\\nFROM public.workflow_runs\\nGROUP BY organization_id, workflow_id;"
    },
    credentials: { postgres: newCredential('Postgres account') },
    position: [450, 300]
  },
  output: [{ organization_id: '', workflow_id: '', total_runs: 0, completed_runs: 0, failed_runs: 0, avg_duration: 0 }]
});

const sib = splitInBatches({
  version: 3,
  config: { name: 'Split Batches', parameters: { batchSize: 50, options: {} }, position: [650, 300] }
});

const upsertMetrics = node({
  type: 'n8n-nodes-base.postgres',
  version: 2,
  config: {
    name: 'Upsert Metrics',
    parameters: {
      operation: 'executeQuery',
      query: "INSERT INTO public.workflow_metrics (\\n  organization_id,\\n  workflow_id,\\n  total_runs,\\n  completed_runs,\\n  failed_runs,\\n  avg_duration,\\n  updated_at\\n)\\nVALUES (\\n  '{{ $json.organization_id }}'::uuid,\\n  '{{ $json.workflow_id }}',\\n  {{ $json.total_runs }},\\n  {{ $json.completed_runs }},\\n  {{ $json.failed_runs }},\\n  {{ $json.avg_duration }},\\n  NOW()\\n)\\nON CONFLICT (organization_id, workflow_id)\\nDO UPDATE SET\\n  total_runs = EXCLUDED.total_runs,\\n  completed_runs = EXCLUDED.completed_runs,\\n  failed_runs = EXCLUDED.failed_runs,\\n  avg_duration = EXCLUDED.avg_duration,\\n  updated_at = NOW();"
    },
    credentials: { postgres: newCredential('Postgres account') },
    position: [850, 300]
  },
  output: [{ upserted: true }]
});

const sendSummary = node({
  type: 'n8n-nodes-base.noOp',
  version: 1,
  config: { name: 'Send Summary', parameters: {}, position: [1050, 300] },
  output: [{ done: true }]
});

export default workflow('wf4-metrics-aggregator', 'WF4 — Metrics Aggregator')
  .add(every5m)
  .to(aggregateRuns)
  .to(sib
    .onEachBatch(upsertMetrics.to(sendSummary.to(nextBatch(sib))))
  );
`;

// ═══════════════════════════════════════════════════════════════
// WF5 — Reply Recovery
// ═══════════════════════════════════════════════════════════════
const wf5Code = `
import { workflow, node, trigger, ifElse, newCredential, expr } from '@n8n/workflow-sdk';

const webhook = trigger({
  type: 'n8n-nodes-base.webhook',
  version: 1.2,
  config: {
    name: 'Webhook',
    parameters: {
      path: 'replay-workflow',
      httpMethod: 'POST',
      responseMode: 'lastNode',
      options: {}
    },
    webhookId: 'replay-workflow',
    position: [250, 300]
  },
  output: [{ workflow_run_id: '', body: {} }]
});

const loadCheckpoint = node({
  type: 'n8n-nodes-base.postgres',
  version: 2,
  config: {
    name: 'Load Checkpoint',
    parameters: {
      operation: 'executeQuery',
      query: "SELECT *\\nFROM public.workflow_run_checkpoints\\nWHERE workflow_run_id = '{{ $json.workflow_run_id }}'::uuid\\nORDER BY created_at DESC\\nLIMIT 1;"
    },
    credentials: { postgres: newCredential('Postgres account') },
    position: [450, 300]
  },
  output: [{ id: '', workflow_run_id: '', checkpoint_data: {} }]
});

const hasCheckpoint = ifElse({
  version: 2.2,
  config: {
    name: 'Has Checkpoint?',
    parameters: {
      conditions: {
        options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' },
        conditions: [
          { id: 'condition-1', leftValue: expr('{{ $json.length }}'), rightValue: '=0', operator: { type: 'number', operation: 'larger' } }
        ],
        combinator: 'and'
      }
    },
    position: [650, 300]
  }
});

const replayWf = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.2,
  config: {
    name: 'Replay Workflow',
    parameters: {
      method: 'POST',
      url: 'https://jebixydqpvsegvrtfmgm.supabase.co/functions/v1/workflow-trigger',
      authentication: 'genericCredentialType',
      nodeCredentialType: 'httpHeaderAuth',
      sendHeaders: true,
      headerParameters: {
        parameters: [
          { name: 'Authorization', value: expr('Bearer {{ $env.SUPABASE_SERVICE_ROLE_KEY }}') },
          { name: 'Content-Type', value: 'application/json' }
        ]
      },
      sendBody: true,
      specifyBody: 'json',
      jsonBody: expr('{\\n  "workflow_id": "{{ $json.workflow_id }}",\\n  "organization_id": "{{ $json.organization_id }}",\\n  "client_id": "{{ $json.client_id }}",\\n  "business_id": "{{ $json.business_id }}",\\n  "input": "{{ $json.checkpoint_data }}",\\n  "idempotency_key": "replay-{{ $json.workflow_run_id }}"\\n}'),
      options: { timeout: 30000, allowUnauthorizedCerts: false }
    },
    position: [850, 150]
  },
  output: [{ status: 'replayed' }]
});

const respondSuccess = node({
  type: 'n8n-nodes-base.respondToWebhook',
  version: 1.1,
  config: {
    name: 'Respond Success',
    parameters: {
      respondWith: 'json',
      responseBody: expr('{{ {\\n  "success": true,\\n  "message": "Workflow replayed successfully",\\n  "workflow_run_id": $json.workflow_run_id,\\n  "workflow_id": $json.workflow_id\\n} }}')
    },
    position: [1050, 150]
  },
  output: [{ responded: true }]
});

const respondNotFound = node({
  type: 'n8n-nodes-base.respondToWebhook',
  version: 1.1,
  config: {
    name: 'Respond NotFound',
    parameters: {
      respondWith: 'json',
      responseStatusCode: 404,
      responseBody: expr('{{ {\\n  "success": false,\\n  "message": "No checkpoint found for workflow_run_id",\\n  "workflow_run_id": $json.workflow_run_id\\n} }}')
    },
    position: [850, 500]
  },
  output: [{ responded: true }]
});

export default workflow('wf5-reply-recovery', 'WF5 — Reply Recovery')
  .add(webhook)
  .to(loadCheckpoint)
  .to(hasCheckpoint
    .onTrue(replayWf.to(respondSuccess))
    .onFalse(respondNotFound)
  );
`;

// ═══════════════════════════════════════════════════════════════
// Deploy
// ═══════════════════════════════════════════════════════════════
const WORKFLOWS = [
  { code: wf1Code, name: 'WF1 — Queue Poller', desc: 'Polls workflow_jobs every 5s, calls worker edge function, alerts Discord on failure' },
  { code: wf2Code, name: 'WF2 — Scheduler', desc: 'Every 1m fetches due schedules from workflow_schedules, triggers edge function, updates next_run_at' },
  { code: wf3Code, name: 'WF3 — Dead Letter Handler', desc: 'Every 5m processes workflow_dead_letters, retries retryable ones, alerts Discord for non-retryable' },
  { code: wf4Code, name: 'WF4 — Metrics Aggregator', desc: 'Every 5m aggregates workflow_runs metrics into workflow_metrics' },
  { code: wf5Code, name: 'WF5 — Reply Recovery', desc: 'Webhook at /replay-workflow, loads checkpoint, replays via edge function or returns 404' },
];

let ok = 0, fail = 0;

for (const wf of WORKFLOWS) {
  console.log(`\n🔍 Validating ${wf.name}...`);
  const valResult = await rpc("tools/call", {
    name: "validate_workflow",
    arguments: { code: wf.code }
  });
  const valText = valResult?.result?.content?.[0]?.text || "{}";
  const valJson = JSON.parse(valText);

  if (valJson.error || !valJson.valid) {
    console.error(`   ❌ Invalid: ${valJson.error || valJson.message || JSON.stringify(valJson).slice(0, 200)}`);
    fail++;
    continue;
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
    console.error(`   ❌ Failed: ${createJson.error}`);
    fail++;
    continue;
  }

  ok++;
  console.log(`   ✅ Created! ID: ${createJson.workflowId || "ok"}  🔗 ${createJson.url || ""}`);
  if (createJson.autoAssignedCredentials?.length) {
    for (const cred of createJson.autoAssignedCredentials) {
      console.log(`   🔑 ${cred.nodeName}: ${cred.credentialName}`);
    }
  }
  if (createJson.note) console.log(`   ℹ️  ${createJson.note}`);
}

console.log(`\n✨ Done: ${ok} deployed, ${fail} failed`);
