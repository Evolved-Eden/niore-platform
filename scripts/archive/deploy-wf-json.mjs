#!/usr/bin/env node
/**
 * Deploy 5 n8n workflow JSON files via REST API.
 * Usage: node scripts/deploy-wf-json.mjs
 * Requires N8N_MCP_TOKEN or N8N_API_KEY env var, or pass as argument.
 */
import { readFileSync } from 'fs';
import https from 'https';
import http from 'http';

const N8N_URL = process.env.N8N_URL || 'https://automation.evolvededen.com';
const API_KEY = process.argv[2] || process.env.N8N_MCP_TOKEN || process.env.N8N_API_KEY;

if (!API_KEY) {
  console.error('❌ N8N API key required. Pass as argument or set N8N_MCP_TOKEN env.');
  process.exit(1);
}

const WF_FILES = [
  'WF1___Queue_Poller.json',
  'WF2___Scheduler.json',
  'WF3___Dead_Letter_Handler.json',
  'WF4___Metrics_Aggregator.json',
  'WF5___Reply_Recovery.json',
];

async function deployWorkflow(filePath) {
  const workflowData = JSON.parse(readFileSync(filePath, 'utf8'));
  const workflowName = workflowData.name || filePath.replace(/^WF\d___/, '').replace('.json', '');
  
  return new Promise((resolve) => {
    const url = new URL('/rest/workflows', N8N_URL);
    const body = JSON.stringify({
      name: workflowName,
      nodes: workflowData.nodes,
      connections: workflowData.connections,
      settings: workflowData.settings || {},
      tags: workflowData.tags || [],
    });

    const client = url.protocol === 'https:' ? https : http;
    const req = client.request(
      url.toString(),
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${API_KEY}`,
          'X-N8N-API-KEY': API_KEY,
        },
        rejectUnauthorized: false,
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          if (res.statusCode === 200 || res.statusCode === 201) {
            const result = JSON.parse(data);
            console.log(`✅ ${workflowName} — ID: ${result.id}`);
            resolve(result);
          } else {
            console.error(`❌ ${workflowName} — (${res.statusCode}): ${data.slice(0, 200)}`);
            resolve(null);
          }
        });
      }
    );

    req.on('error', (err) => {
      console.error(`❌ ${workflowName} — Connection error: ${err.message}`);
      resolve(null);
    });

    req.write(body);
    req.end();
  });
}

async function main() {
  console.log(`🚀 Deploying ${WF_FILES.length} workflows to ${N8N_URL}\n`);
  
  let success = 0;
  for (const file of WF_FILES) {
    const result = await deployWorkflow(file);
    if (result) success++;
  }
  
  console.log(`\n📊 Result: ${success}/${WF_FILES.length} workflows deployed`);
}

main().catch(e => { console.error('FATAL:', e); process.exit(1); });
