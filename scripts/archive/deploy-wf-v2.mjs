#!/usr/bin/env node
/**
 * Deploy 5 n8n workflows via the correct public API endpoint.
 * n8n public API: POST /api/v1/workflows
 */
import { readFileSync } from 'fs';
import https from 'https';

// User's public API key (aud: public-api)
const PUBLIC_API_KEY = process.argv[2] || process.env.N8N_PUBLIC_API_KEY ;

const N8N_URL = 'https://automation.evolvededen.com';

const WF_FILES = [
  'WF1___Queue_Poller.json',
  'WF2___Scheduler.json',
  'WF3___Dead_Letter_Handler.json',
  'WF4___Metrics_Aggregator.json',
  'WF5___Reply_Recovery.json',
];

async function deployViaPublicAPI(filePath) {
  const workflowData = JSON.parse(readFileSync(filePath, 'utf8'));
  const workflowName = workflowData.name || 'Workflow';

  return new Promise((resolve) => {
    const url = new URL('/api/v1/workflows', N8N_URL);
    
    // Public API requires settings but restricts additional properties
    const payload = {
      name: workflowName,
      nodes: workflowData.nodes,
      connections: workflowData.connections,
      settings: {},
    };

    const body = JSON.stringify(payload);

    const req = https.request(
      url.toString(),
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-N8N-API-KEY': PUBLIC_API_KEY,
        },
        rejectUnauthorized: false,
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          if (res.statusCode === 200 || res.statusCode === 201) {
            const result = JSON.parse(data);
            console.log(`âœ… ${workflowName} â€” ID: ${result.id || result.data?.id}`);
            resolve(result);
          } else if (res.statusCode === 401 || res.statusCode === 403) {
            console.error(`âŒ ${workflowName} â€” Auth failed (${res.statusCode}). Check API key.`);
            console.error(`   Response: ${data.slice(0, 200)}`);
            resolve(null);
          } else {
            console.error(`âŒ ${workflowName} â€” (${res.statusCode}): ${data.slice(0, 200)}`);
            resolve(null);
          }
        });
      }
    );

    req.on('error', (err) => {
      console.error(`âŒ ${workflowName} â€” Connection error: ${err.message}`);
      resolve(null);
    });

    req.write(body);
    req.end();
  });
}

// Also try with the alternative approach: POST to /rest/workflows with X-N8N-API-KEY
async function deployViaRestAPI(filePath) {
  const workflowData = JSON.parse(readFileSync(filePath, 'utf8'));
  const workflowName = workflowData.name || 'Workflow';

  return new Promise((resolve) => {
    const url = new URL('/rest/workflows', N8N_URL);
    const body = JSON.stringify({
      name: workflowName,
      nodes: workflowData.nodes,
      connections: workflowData.connections,
      settings: workflowData.settings || {},
      tags: workflowData.tags || [],
    });

    const req = https.request(
      url.toString(),
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-N8N-API-KEY': PUBLIC_API_KEY,
        },
        rejectUnauthorized: false,
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          if (res.statusCode === 200 || res.statusCode === 201) {
            const result = JSON.parse(data);
            console.log(`âœ… ${workflowName} â€” ID: ${result.id}`);
            resolve(result);
          } else {
            console.error(`âŒ ${workflowName} REST â€” (${res.statusCode}): ${data.slice(0, 200)}`);
            resolve(null);
          }
        });
      }
    );

    req.on('error', (err) => {
      console.error(`âŒ ${workflowName} â€” Error: ${err.message}`);
      resolve(null);
    });

    req.write(body);
    req.end();
  });
}

async function main() {
  console.log(`ðŸš€ Deploying ${WF_FILES.length} workflows to ${N8N_URL}\n`);

  // Try public API first
  console.log('--- Trying /api/v1/workflows (Public API) ---');
  let success = 0;
  for (const file of WF_FILES) {
    const result = await deployViaPublicAPI(file);
    if (result) success++;
  }

  if (success === 0) {
    console.log('\n--- Falling back to /rest/workflows (REST API) ---');
    for (const file of WF_FILES) {
      const result = await deployViaRestAPI(file);
      if (result) success++;
    }
  }

  console.log(`\nðŸ“Š Result: ${success}/${WF_FILES.length} workflows deployed`);
}

main().catch(e => { console.error('FATAL:', e); process.exit(1); });
