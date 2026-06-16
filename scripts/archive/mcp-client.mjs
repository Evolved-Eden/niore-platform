/**
 * MCP client using raw SSE + JSON-RPC
 * 
 * This bypasses the MCP SDK EventSource wrapper and handles the SSE
 * stream directly with Node.js HTTP(S) module.
 */
import https from "https";
import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const TOKEN = process.env.N8N_MCP_TOKEN;
if (!TOKEN) { console.error("❌ N8N_MCP_TOKEN not set"); process.exit(1); }

const HOST = "automation.evolvededen.com";

// SSE stream parser
async function sseConnect(path, onEvent) {
  return new Promise((resolve, reject) => {
    const req = https.get(
      {
        hostname: HOST,
        port: 443,
        path,
        headers: {
          Authorization: `Bearer ${TOKEN}`,
          Accept: "text/event-stream",
          "Cache-Control": "no-cache",
        },
        rejectUnauthorized: false,
        timeout: 15000,
      },
      (res) => {
        console.log(`SSE Status: ${res.statusCode}`);
        if (res.statusCode !== 200) {
          let d = "";
          res.on("data", c => d += c);
          res.on("end", () => reject(new Error(`SSE ${res.statusCode}: ${d}`)));
          return;
        }

        let buffer = "";
        let currentEvent = "";
        let currentData = "";
        let resolved = false;

        const processLine = (line) => {
          if (line === "") {
            // Empty line = end of event
            if (currentEvent || currentData) {
              onEvent(currentEvent || "message", currentData);
              if (!resolved && (currentEvent === "endpoint" || currentData.startsWith("http"))) {
                resolved = true;
                resolve(currentData);
              }
            }
            currentEvent = "";
            currentData = "";
            return;
          }
          if (line.startsWith("event: ")) {
            currentEvent = line.slice(7).trim();
          } else if (line.startsWith("data: ")) {
            currentData = line.slice(6);
          }
        };

        res.on("data", (chunk) => {
          buffer += chunk.toString();
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";
          for (const line of lines) {
            processLine(line.replace(/\r$/, ""));
          }
        });

        res.on("end", () => {
          if (buffer) processLine(buffer.replace(/\r$/, ""));
          if (!resolved) reject(new Error("SSE stream ended without endpoint"));
        });
      }
    );
    req.on("error", reject);
    req.on("timeout", () => { req.destroy(); reject(new Error("SSE timeout")); });
  });
}

function jsonRpcRequest(path, body) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const opts = {
      hostname: HOST, port: 443, path, method: "POST",
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        "Content-Type": "application/json",
        "Accept": "application/json, text/event-stream",
        "Content-Length": Buffer.byteLength(payload),
      },
      rejectUnauthorized: false,
      timeout: 15000,
    };
    const req = https.request(opts, (res) => {
      let data = "";
      res.on("data", c => data += c);
      res.on("end", () => resolve({ status: res.statusCode, data }));
    });
    req.on("error", reject);
    req.on("timeout", () => { req.destroy(); reject(new Error("Request timeout")); });
    req.write(payload);
    req.end();
  });
}

async function main() {
  console.log("🔌 Connecting to MCP SSE...");
  
  let sessionPath;
  try {
    sessionPath = await sseConnect("/mcp-server/http", (event, data) => {
      console.log(`SSE event: ${event} => ${data.slice(0, 100)}`);
    });
    console.log(`✅ Session endpoint: ${sessionPath}`);
  } catch (err) {
    console.error(`❌ SSE error: ${err.message}`);
    console.log("\nTrying alternative approach...");
    return;
  }

  // Now send JSON-RPC via POST
  const id = 1;
  
  // List tools
  const toolsResp = await jsonRpcRequest(sessionPath, {
    jsonrpc: "2.0", id: id++, method: "tools/list", params: {}
  });
  console.log(`\n📋 tools/list status: ${toolsResp.status}`);
  console.log(`Response: ${toolsResp.data}`);

  if (toolsResp.status !== 200) {
    console.error("❌ Failed to list tools");
    return;
  }

  const toolsResult = JSON.parse(toolsResp.data);
  console.log(`Available tools:`, toolsResult.result?.tools?.map(t => t.name) || []);

  // Create workflows
  const workflowDir = join(__dirname, "..", "workflows");
  const files = ["wf1-queue-poller.json", "wf2-scheduler.json", "wf3-dead-letter-handler.json", "wf4-metrics-aggregator.json", "wf5-reply-recovery.json"];

  for (const file of files) {
    const wf = JSON.parse(readFileSync(join(workflowDir, file), "utf-8"));
    console.log(`\n📦 Creating ${wf.name}...`);

    const resp = await jsonRpcRequest(sessionPath, {
      jsonrpc: "2.0",
      id: id++,
      method: "tools/call",
      params: {
        name: "create_workflow",
        arguments: {
          name: wf.name,
          nodes: wf.nodes,
          connections: wf.connections,
          settings: wf.settings || {},
          staticData: wf.staticData || null,
          tags: wf.tags || [],
        },
      },
    });

    try {
      const result = JSON.parse(resp.data);
      if (result.error) console.log(`  ❌ ${result.error.message}`);
      else console.log(`  ✅ Created! (ID: ${result.result?.id || "unknown"})`);
    } catch {
      console.log(`  Status: ${resp.status}, Raw: ${resp.data.slice(0, 300)}`);
    }
  }

  console.log("\n✨ Done!");
}

main().catch(console.error);
