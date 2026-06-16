/**
 * Archive all wrong/deployed workflows so we can redo them properly
 * Run: node scripts/delete-bad-wfs.mjs
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

const TO_ARCHIVE = [
  { id: "t1tc87sMOCGIQXRJ", name: "WF1 — Queue Poller" },
  { id: "4frG1VOoA1yFCx6s", name: "WF2 — Scheduler" },
  { id: "Yziod8zmIuudglg6", name: "WF3 — Dead Letter Handler" },
  { id: "kmQO9StXz64YxjND", name: "WF4 — Metrics Aggregator" },
  { id: "uItpFUkPFSSaU9JB", name: "WF5 — Reply Recovery" },
];

for (const wf of TO_ARCHIVE) {
  console.log(`🗑️ Archiving ${wf.name} (${wf.id})...`);
  const result = await rpc("tools/call", {
    name: "archive_workflow",
    arguments: { workflowId: wf.id }
  });
  const text = result?.result?.content?.[0]?.text || JSON.stringify(result);
  console.log(`   ${text.slice(0, 200)}`);
}

console.log("\n✨ All archived");
