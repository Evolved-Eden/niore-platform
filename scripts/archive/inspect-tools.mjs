/**
 * Inspect n8n MCP tool schemas
 * Run: node scripts/inspect-tools.mjs
 */
import https from "https";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const TOKEN = process.env.N8N_MCP_TOKEN;
if (!TOKEN) { console.error("❌ N8N_MCP_TOKEN not set"); process.exit(1); }

const HOST = "automation.evolvededen.com";

function request(method, path, headers, body) {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: HOST, port: 443, path, method,
      headers: { ...headers, Authorization: `Bearer ${TOKEN}` },
      rejectUnauthorized: false, timeout: 15000,
    };
    const req = https.request(opts, (res) => {
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => resolve({ status: res.statusCode, data }));
    });
    req.on("error", reject);
    req.on("timeout", () => { req.destroy(); reject(new Error("Timeout")); });
    if (body) req.write(body);
    req.end();
  });
}

async function main() {
  const body = JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list", params: {} });
  const resp = await request("POST", "/mcp-server/http",
    { "Content-Type": "application/json", Accept: "application/json, text/event-stream" },
    body
  );

  // Parse SSE response - extract JSON data from event stream
  let jsonStr = resp.data;
  // Handle SSE format: "event: message\ndata: {...}\n\n"
  const dataMatch = resp.data.match(/data:\s*(\{[\s\S]*\})/);
  if (dataMatch) jsonStr = dataMatch[1];

  const data = JSON.parse(jsonStr);
  const tools = data.result?.tools || [];

  const targets = ["create_workflow_from_code", "update_workflow", "validate_workflow", "search_workflows"];

  for (const t of tools) {
    if (targets.includes(t.name)) {
      console.log(`\n=== ${t.name} ===`);
      console.log(`Description: ${t.description || "none"}`);
      console.log(`Input schema: ${JSON.stringify(t.inputSchema || t.input_schema || {}, null, 2)}`);
    }
  }

  // Also try create_workflow_from_code with description-only to see format
  console.log("\n\n=== Trying create_workflow_from_code with description ===");
  const testBody = JSON.stringify({
    jsonrpc: "2.0", id: 2,
    method: "tools/call",
    params: {
      name: "create_workflow_from_code",
      arguments: {
        name: "Test Workflow",
        code: JSON.stringify({ nodes: [], connections: {} })
      },
    },
  });
  const testResp = await request("POST", "/mcp-server/http",
    { "Content-Type": "application/json", Accept: "application/json, text/event-stream" },
    testBody
  );
  function extractJson(raw) {
    const m = raw.match(/data:\s*(\{[\s\S]*\})/);
    return m ? m[1] : raw;
  }

  console.log(`Status: ${testResp.status}`);
  try {
    const r = JSON.parse(extractJson(testResp.data));
    console.log(`Result: ${JSON.stringify(r, null, 2).slice(0, 800)}`);
  } catch { console.log(`Raw: ${testResp.data.slice(0, 500)}`); }

  // Try with natural language description
  console.log("\n\n=== Trying with NL description ===");
  const testBody2 = JSON.stringify({
    jsonrpc: "2.0", id: 3,
    method: "tools/call",
    params: {
      name: "create_workflow_from_code",
      arguments: {
        name: "Test Workflow",
        code: "A workflow that polls a queue every 5 seconds and processes pending items"
      },
    },
  });
  const testResp2 = await request("POST", "/mcp-server/http",
    { "Content-Type": "application/json", Accept: "application/json, text/event-stream" },
    testBody2
  );
  console.log(`Status: ${testResp2.status}`);
  try {
    const r = JSON.parse(extractJson(testResp2.data));
    console.log(`Result: ${JSON.stringify(r, null, 2).slice(0, 800)}`);
  } catch { console.log(`Raw: ${testResp2.data.slice(0, 500)}`); }
}

main().catch(console.error);
