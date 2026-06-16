/**
 * Test validate_workflow for WF1 — v4 (clear all warnings)
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
      rejectUnauthorized: false, timeout: 20000,
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

const code = [
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
  `        conditions: [`,
  `          { id: 'condition-1', leftValue: expr('{{ $json.pending_count }}'), rightValue: '=0', operator: { type: 'number', operation: 'larger' } }`,
  `        ],`,
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
  `      headerParameters: {`,
  `        parameters: [`,
  `          { name: 'Authorization', value: expr('Bearer {{ $env.SUPABASE_SERVICE_ROLE_KEY }}') },`,
  `          { name: 'Content-Type', value: 'application/json' }`,
  `        ]`,
  `      },`,
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
].join("\n");

console.log("=== VALIDATING WF1 (v4) ===");
const result = await rpc("tools/call", {
  name: "validate_workflow",
  arguments: { code }
});
const text = result?.result?.content?.[0]?.text || JSON.stringify(result).slice(0, 1000);
console.log(text);
