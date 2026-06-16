#!/usr/bin/env node
import { listTools, callTool, validateWorkflow } from "../lib/n8n-client.mjs";

if (!process.env.N8N_MCP_TOKEN && !process.env.N8N_API_KEY) {
  console.error("❌ Set N8N_MCP_TOKEN or N8N_API_KEY before running this script.");
  process.exit(1);
}

async function main() {
  console.log("🔗 Connecting to n8n MCP...");

  try {
    const tools = await listTools();
    console.log("✅ tools/list result:", JSON.stringify(tools.result?.tools || tools, null, 2));
  } catch (error) {
    console.error("❌ tools/list failed:", error.message);
    process.exit(1);
  }

  try {
    const validateResult = await validateWorkflow("console.log('hello from n8n validateWorkflow');");
    console.log("✅ validate_workflow result:", JSON.stringify(validateResult.result || validateResult, null, 2));
  } catch (error) {
    console.error("❌ validate_workflow failed:", error.message);
    process.exit(1);
  }

  try {
    const callResult = await callTool("echo", { text: "hello" });
    console.log("✅ example tools/call result:", JSON.stringify(callResult.result || callResult, null, 2));
  } catch (error) {
    console.warn("⚠️ example tools/call failed (tool may not exist):", error.message);
  }
}

main().catch((error) => {
  console.error("💥 Unexpected error:", error);
  process.exit(1);
});
