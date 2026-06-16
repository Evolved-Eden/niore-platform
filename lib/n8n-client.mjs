import https from "https";
import { URL } from "url";

const N8N_BASE_URL = process.env.N8N_BASE_URL || "https://automation.evolvededen.com";
const N8N_MCP_PATH = process.env.N8N_MCP_PATH || "/mcp-server/http";
const N8N_MCP_TOKEN = process.env.N8N_MCP_TOKEN || process.env.N8N_API_KEY;

function ensureToken() {
  if (!N8N_MCP_TOKEN) {
    throw new Error("N8N_MCP_TOKEN or N8N_API_KEY must be set in environment variables.");
  }
}

function buildUrl() {
  const url = new URL(N8N_BASE_URL);
  url.pathname = N8N_MCP_PATH;
  return url;
}

function requestJsonRpc(method, params = {}) {
  ensureToken();
  const target = buildUrl();
  const payload = JSON.stringify({ jsonrpc: "2.0", id: Date.now(), method, params });

  return new Promise((resolve, reject) => {
    const opts = {
      hostname: target.hostname,
      port: target.port || 443,
      path: `${target.pathname}${target.search}`,
      method: "POST",
      headers: {
        Authorization: `Bearer ${N8N_MCP_TOKEN}`,
        "Content-Type": "application/json",
        Accept: "application/json, text/event-stream",
        "Cache-Control": "no-cache",
      },
      rejectUnauthorized: false,
      timeout: 30000,
    };

    const req = https.request(opts, (res) => {
      let data = "";
      res.on("data", (chunk) => { data += chunk; });
      res.on("end", () => {
        if (!data) {
          return reject(new Error(`Empty response from n8n MCP (status=${res.statusCode})`));
        }

        try {
          const json = JSON.parse(data);
          if (json.error) {
            const errorText = typeof json.error === "string" ? json.error : json.error.message || JSON.stringify(json.error);
            return reject(new Error(`n8n MCP error: ${errorText}`));
          }
          return resolve(json);
        } catch (parseError) {
          return reject(new Error(`Unable to parse n8n MCP response: ${parseError.message}\n${data}`));
        }
      });
    });

    req.on("error", reject);
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("n8n MCP request timed out"));
    });

    req.write(payload);
    req.end();
  });
}

export async function listTools() {
  return requestJsonRpc("tools/list", {});
}

export async function callTool(name, args = {}) {
  return requestJsonRpc("tools/call", { name, arguments: args });
}

export async function validateWorkflow(code) {
  return callTool("validate_workflow", { code });
}

export async function getWorkflowInfo(workflowId) {
  return callTool("get_workflow", { id: workflowId });
}

export default {
  listTools,
  callTool,
  validateWorkflow,
  getWorkflowInfo,
};
