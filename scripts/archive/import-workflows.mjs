#!/usr/bin/env node
/**
 * Import n8n workflow JSONs into the n8n instance.
 * Usage: node workflows/import-workflows.mjs <n8n-api-key>
 * 
 * The n8n server must be running at N8N_URL (default: https://automation.evolvededen.com)
 */

const N8N_URL = process.env.N8N_URL || 'https://automation.evolvededen.com';
const API_KEY = process.argv[2] || process.env.N8N_MCP_TOKEN;

if (!API_KEY) {
  console.error('❌ N8N API key required. Pass as argument or set N8N_MCP_TOKEN env.');
  process.exit(1);
}

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const WORKFLOW_FILES = [
  'wf1-queue-poller.json',
  'wf2-scheduler.json',
  'wf3-dead-letter-handler.json',
  'wf4-metrics-aggregator.json',
  'wf5-reply-recovery.json',
];

const workflowsDir = path.join(__dirname);

async function importWorkflow(filePath) {
  const workflowData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const workflowName = workflowData.name || path.basename(filePath, '.json');

  return new Promise((resolve, reject) => {
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
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          if (res.statusCode === 200 || res.statusCode === 201) {
            console.log(`✅ Imported: ${workflowName}`);
            resolve(JSON.parse(data));
          } else {
            console.error(`❌ Failed (${res.statusCode}): ${workflowName} — ${data.slice(0, 200)}`);
            resolve(null);
          }
        });
      }
    );

    req.on('error', (err) => {
      console.error(`❌ Connection error for ${workflowName}: ${err.message}`);
      resolve(null);
    });

    req.write(body);
    req.end();
  });
}

async function main() {
  console.log(`🔌 Connecting to n8n at ${N8N_URL}...\n`);

  // Check connectivity first
  try {
    await importWorkflow(path.join(workflowsDir, WORKFLOW_FILES[0]));
  } catch {
    console.log('⚠ Could not connect. Make sure n8n is running and the URL is correct.');
  }

  // Import all workflows in sequence
  for (const file of WORKFLOW_FILES) {
    const filePath = path.join(workflowsDir, file);
    if (fs.existsSync(filePath)) {
      await importWorkflow(filePath);
    } else {
      console.log(`⚠ Not found: ${file}`);
    }
  }

  console.log('\nDone. Check n8n UI to verify workflows were imported.');
}

main();
