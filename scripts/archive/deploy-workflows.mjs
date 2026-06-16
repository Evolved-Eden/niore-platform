/**
 * Deploy n8n workflows via MCP client
 *
 * Run: node scripts/deploy-workflows.mjs
 * Requires N8N_MCP_TOKEN in environment
 */
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const __dirname = dirname(fileURLToPath(import.meta.url));
const WORKFLOWS_DIR = join(__dirname, "..", "workflows");

const MCP_URL = "https://automation.evolvededen.com/mcp-server/http";
const TOKEN = process.env.N8N_MCP_TOKEN;

if (!TOKEN) {
  console.error("❌ N8N_MCP_TOKEN environment variable not set");
  process.exit(1);
}

const workflowFiles = [
  "wf1-queue-poller.json",
  "wf2-scheduler.json",
  "wf3-dead-letter-handler.json",
  "wf4-metrics-aggregator.json",
  "wf5-reply-recovery.json",
];

async function deploy() {
  console.log("🔌 Connecting to n8n MCP server...");

  const transport = new SSEClientTransport(new URL(MCP_URL), {
    headers: {
      Authorization: `Bearer ${TOKEN}`,
    },
    requestInit: {
      headers: {
        Authorization: `Bearer ${TOKEN}`,
      },
    },
  });

  const client = new Client(
    { name: "evolved-eden-deployer", version: "1.0.0" },
    { capabilities: {} }
  );

  await client.connect(transport);
  console.log("✅ Connected");

  // List tools
  const tools = await client.listTools();
  console.log("\n🧰 Available tools:");
  for (const tool of tools.tools) {
    console.log(`  - ${tool.name}: ${(tool.description || "").slice(0, 80)}`);
  }

  const createTool = tools.tools.find((t) => t.name === "create_workflow");
  if (!createTool) {
    console.error("❌ create_workflow tool not found!");
    process.exit(1);
  }

  console.log("\n📦 Deploying workflows...");

  for (const file of workflowFiles) {
    const filePath = join(WORKFLOWS_DIR, file);
    const wf = JSON.parse(readFileSync(filePath, "utf-8"));

    console.log(`  Creating "${wf.name}"...`);

    try {
      const result = await client.callTool({
        name: "create_workflow",
        arguments: {
          name: wf.name,
          nodes: wf.nodes,
          connections: wf.connections,
          settings: wf.settings,
          staticData: wf.staticData,
          tags: wf.tags || [],
        },
      });

      const text = result.content?.[0]?.text || JSON.stringify(result);
      console.log(`  ✅ ${text}`);
    } catch (err) {
      console.error(`  ❌ Error: ${err.message}`);
    }
  }

  await client.close();
  console.log("\n✨ All done!");
}

deploy().catch((err) => {
  console.error("💥 Fatal:", err.message);
  process.exit(1);
});
