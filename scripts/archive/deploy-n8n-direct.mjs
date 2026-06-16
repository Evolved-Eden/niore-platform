/**
 * Deploy n8n workflows — direct MCP SSE connection
 * Run: node scripts/deploy-n8n-direct.mjs
 */
import https from "https";
import http from "http";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const WORKFLOWS_DIR = join(__dirname, "..", "workflows");
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const TOKEN = process.env.N8N_MCP_TOKEN;
if (!TOKEN) { console.error("❌ N8N_MCP_TOKEN not set"); process.exit(1); }

const HOST = "automation.evolvededen.com";
const MCP_PATH = "/mcp-server/http";

// ── HTTP helper ───────────────────────────────────────────────
function request(method, path, headers, body, rawStream = false) {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: HOST, port: 443, path, method,
      headers: { ...headers, Authorization: `Bearer ${TOKEN}` },
      rejectUnauthorized: false,
      timeout: 30000,
    };
    const req = https.request(opts, (res) => {
      if (rawStream) return resolve(res); // return stream for SSE
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => resolve({ status: res.statusCode, headers: res.headers, data }));
    });
    req.on("error", reject);
    req.on("timeout", () => { req.destroy(); reject(new Error("Timeout")); });
    if (body) req.write(body);
    req.end();
  });
}

// ── SSE: connect, get session, then POST JSON-RPC ─────────────
async function sseGetSession() {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: HOST, port: 443, path: MCP_PATH, method: "GET",
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        Accept: "text/event-stream",
        "Cache-Control": "no-cache",
      },
      rejectUnauthorized: false,
      timeout: 15000,
    };
    const req = https.request(opts, (res) => {
      let buffer = "";
      let resolved = false;

      const tryParse = (chunk) => {
        buffer += chunk.toString();
        // n8n MCP sends: event: endpoint\ndata: <session-url>\n\n
        const epMatch = buffer.match(/event:\s*endpoint\s*\ndata:\s*(\S+)/);
        if (epMatch && !resolved) {
          resolved = true;
          req.destroy();
          resolve(epMatch[1]);
        }
      };

      res.on("data", tryParse);
      res.on("end", () => { if (!resolved) reject(new Error("SSE ended without endpoint")); });
    });
    req.on("error", reject);
    req.on("timeout", () => { req.destroy(); reject(new Error("SSE timeout")); });
    req.end();
  });
}

async function main() {
  console.log("🔌 Connecting to n8n MCP (SSE)...\n");

  // Step 1: SSE → get session URL
  let sessionPath;
  try {
    sessionPath = await sseGetSession();
    console.log(`✅ Session: ${sessionPath}\n`);
  } catch (err) {
    console.log(`⚠️ SSE: ${err.message}. Trying direct POST...`);
    sessionPath = MCP_PATH;
  }

  // Step 2: List tools via JSON-RPC POST
  const listBody = JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list", params: {} });
  const listResp = await request("POST", sessionPath,
    { "Content-Type": "application/json", Accept: "application/json, text/event-stream" },
    listBody
  );
  console.log(`📋 tools/list: ${listResp.status}`);

  if (listResp.status !== 200) {
    console.error(`❌ tools/list failed: ${listResp.data.slice(0, 300)}`);
    process.exit(1);
  }

  let toolsResult;
  try { toolsResult = JSON.parse(listResp.data); } catch {
    // Response might be SSE stream — try to extract JSON
    const jsonMatch = listResp.data.match(/\{[\s\S]*"result"[\s\S]*\}/);
    if (jsonMatch) toolsResult = JSON.parse(jsonMatch[0]);
    else { console.error("Could not parse tools response"); process.exit(1); }
  }

  const tools = toolsResult.result?.tools || [];
  console.log(`🧰 Available: ${tools.map(t => t.name).join(", ")}\n`);

  // Check which create tool is available
  const createTools = ["create_workflow_from_code", "create_workflow", "update_workflow"];
  const createTool = tools.find(t => createTools.includes(t.name));
  if (!createTool) {
    console.error("❌ No create/update workflow tool available");
    process.exit(1);
  }
  console.log(`🔧 Using tool: ${createTool.name}\n`);

  // Check the input schema for createTool
  const inputSchema = createTool.inputSchema || {};
  const requiredProps = Object.keys(inputSchema.properties || {});
  console.log(`   Arguments: ${requiredProps.join(", ") || "none"}`);

  // Step 3: Deploy each workflow
  const files = ["wf1-queue-poller.json", "wf2-scheduler.json", "wf3-dead-letter-handler.json", "wf4-metrics-aggregator.json", "wf5-reply-recovery.json"];

  for (const file of files) {
    const wf = JSON.parse(readFileSync(join(WORKFLOWS_DIR, file), "utf-8"));
    console.log(`📦 ${wf.name}...`);

    const toolArgs = createTool.name === "create_workflow_from_code"
      ? { code: JSON.stringify(wf) }
      : {
          name: wf.name,
          nodes: wf.nodes,
          connections: wf.connections,
          settings: wf.settings || {},
          staticData: wf.staticData || null,
          tags: wf.tags || [],
        };

    const createBody = JSON.stringify({
      jsonrpc: "2.0", id: files.indexOf(file) + 2,
      method: "tools/call",
      params: {
        name: createTool.name,
        arguments: toolArgs,
      },
    });

    const resp = await request("POST", sessionPath,
      { "Content-Type": "application/json", Accept: "application/json, text/event-stream" },
      createBody
    );

    try {
      const result = JSON.parse(resp.data);
      if (result.error) console.log(`  ❌ ${result.error.message}`);
      else console.log(`  ✅ Created (ID: ${result.result?.id || "ok"})`);
    } catch {
      console.log(`  Status: ${resp.status}, Raw: ${(resp.data || "").slice(0, 200)}`);
    }
  }

  console.log("\n✨ Done!");
}

main().catch((err) => { console.error("💥", err.message); process.exit(1); });
