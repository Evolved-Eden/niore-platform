/**
 * Get n8n Workflow SDK reference
 * Run: node scripts/get-sdk-ref.mjs
 */
import https from "https";
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const TOKEN = process.env.N8N_MCP_TOKEN;
if (!TOKEN) { console.error("❌ N8N_MCP_TOKEN not set"); process.exit(1); }

function request(body) {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: "automation.evolvededen.com",
      port: 443, path: "/mcp-server/http", method: "POST",
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

const body = JSON.stringify({
  jsonrpc: "2.0", id: 1,
  method: "tools/call",
  params: { name: "get_sdk_reference", arguments: {} },
});

const result = await request(body);
const text = result?.result?.content?.[0]?.text || JSON.stringify(result);
console.log(text);
