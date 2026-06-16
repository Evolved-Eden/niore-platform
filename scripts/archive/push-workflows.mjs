/**
 * Push workflows to n8n via MCP SSE transport (raw implementation)
 *
 * Run: node scripts/push-workflows.mjs
 * Uses N8N_MCP_TOKEN env var
 */
import http from "http";
import https from "https";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const __dirname = dirname(fileURLToPath(import.meta.url));
const WORKFLOWS_DIR = join(__dirname, "..", "workflows");
const TOKEN = process.env.N8N_MCP_TOKEN;

if (!TOKEN) {
  console.error("❌ N8N_MCP_TOKEN env var not set");
  process.exit(1);
}

const HOST = "automation.evolvededen.com";
const MCP_PATH = "/mcp-server/http";

function httpsRequest(method, path, headers, body) {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: HOST,
      port: 443,
      path,
      method,
      headers: { ...headers, Authorization: `Bearer ${TOKEN}` },
      rejectUnauthorized: false,
    };
    const req = https.request(opts, (res) => {
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => resolve({ status: res.statusCode, headers: res.headers, data }));
    });
    req.on("error", reject);
    if (body) req.write(body);
    req.end();
  });
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  // Step 1: Open SSE connection to get session endpoint
  console.log("🔌 Opening SSE connection...");

  const sseResult = await new Promise((resolve, reject) => {
    const opts = {
      hostname: HOST,
      port: 443,
      path: MCP_PATH,
      method: "GET",
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        Accept: "text/event-stream",
        "Cache-Control": "no-cache",
      },
      rejectUnauthorized: false,
      timeout: 8000,
    };
    const req = https.request(opts, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk.toString();
        // Look for endpoint event
        const endpointMatch = data.match(/event: endpoint\ndata: ([^\n]+)/);
        if (endpointMatch) {
          req.destroy();
          resolve({ endpoint: endpointMatch[1], raw: data });
        }
      });
      res.on("end", () => resolve({ endpoint: null, raw: data }));
    });
    req.on("error", (err) => {
      // If we already got data, resolve with it
      resolve({ endpoint: null, raw: "", error: err.message });
    });
    req.on("timeout", () => {
      req.destroy();
      resolve({ endpoint: null, raw: "", error: "timeout" });
    });
    req.end();
  });

  console.log("SSE response:", JSON.stringify(sseResult));

  if (!sseResult.endpoint) {
    console.log("⚠️ No SSE endpoint received. Trying direct POST approach...");
  }

  // Step 2: Send JSON-RPC to list tools
  const sessionPath = sseResult.endpoint || MCP_PATH;
  console.log(`\n📡 Session path: ${sessionPath}`);

  const listResp = await httpsRequest(
    "POST",
    sessionPath,
    { "Content-Type": "application/json" },
    JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list", params: {} })
  );
  console.log(`Tools list status: ${listResp.status}`);
  console.log(`Response: ${listResp.data.slice(0, 500)}`);

  if (listResp.status !== 200) {
    console.log("\n⚠️ MCP tools/list failed. Trying REST API approach...");

    // Fallback to REST API with API key
    const apiKey = process.env.N8N_API_KEY || "";
    console.log(`Trying REST API with apiKey length: ${apiKey.length}`);

    if (apiKey.length > 10) {
      for (const file of ["wf1-queue-poller.json", "wf2-scheduler.json", "wf3-dead-letter-handler.json", "wf4-metrics-aggregator.json", "wf5-reply-recovery.json"]) {
        const wf = JSON.parse(readFileSync(join(WORKFLOWS_DIR, file), "utf-8"));
        console.log(`\n📦 Creating ${wf.name}...`);
        
        const body = JSON.stringify({
          name: wf.name, nodes: wf.nodes, connections: wf.connections,
          settings: wf.settings, staticData: wf.staticData, tags: wf.tags || []
        });
        
        const resp = await httpsRequest(
          "POST", "/rest/workflows",
          { "Content-Type": "application/json", "X-N8N-API-KEY": apiKey },
          body
        );
        console.log(`  Status: ${resp.status}, Response: ${resp.data.slice(0, 200)}`);
      }
    }
    return;
  }

  // Step 3: Parse tools
  const listData = JSON.parse(listResp.data);
  const createTool = listData.result?.tools?.find(t => t.name === "create_workflow");
  if (!createTool) {
    console.error("❌ create_workflow tool not found");
    console.log("Available:", listData.result?.tools?.map(t => t.name));
    return;
  }
  console.log("✅ create_workflow tool found!");

  // Step 4: Create each workflow
  const files = ["wf1-queue-poller.json", "wf2-scheduler.json", "wf3-dead-letter-handler.json", "wf4-metrics-aggregator.json", "wf5-reply-recovery.json"];
  
  for (const file of files) {
    const wf = JSON.parse(readFileSync(join(WORKFLOWS_DIR, file), "utf-8"));
    console.log(`\n📦 Creating ${wf.name}...`);

    const createResp = await httpsRequest(
      "POST", sessionPath,
      { "Content-Type": "application/json" },
      JSON.stringify({
        jsonrpc: "2.0",
        id: files.indexOf(file) + 2,
        method: "tools/call",
        params: {
          name: "create_workflow",
          arguments: {
            name: wf.name,
            nodes: wf.nodes,
            connections: wf.connections,
            settings: wf.settings,
            staticData: wf.staticData,
            tags: wf.tags || [],
          },
        },
      })
    );

    console.log(`  Status: ${createResp.status}`);
    try {
      const result = JSON.parse(createResp.data);
      if (result.error) console.log(`  ❌ ${result.error.message}`);
      else console.log(`  ✅ Created!`);
    } catch {
      console.log(`  Response: ${createResp.data.slice(0, 300)}`);
    }
  }

  console.log("\n✨ Done!");
}

main().catch(console.error);
