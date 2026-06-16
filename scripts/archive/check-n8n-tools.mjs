import { listTools } from '../lib/n8n-client.mjs';
import { readFileSync, existsSync } from 'fs';

async function main() {
  console.log('Checking n8n MCP tools...\n');
  
  try {
    const result = await listTools();
    const tools = result?.result?.tools || result?.tools || [];
    console.log(`Found ${tools.length} tools:\n`);
    for (const t of tools) {
      console.log(`  ${t.name}`);
      if (t.description) console.log(`    ${t.description}`);
      if (t.inputSchema) console.log(`    params: ${JSON.stringify(t.inputSchema).slice(0, 200)}`);
      console.log('');
    }
  } catch(e) {
    console.error('Error listing tools:', e.message);
    
    // Alternative - try the deploy script approach with MCP SDK
    console.log('\nTrying MCP SDK approach...');
    try {
      const { Client } = await import('@modelcontextprotocol/sdk/client/index.js');
      const { SSEClientTransport } = await import('@modelcontextprotocol/sdk/client/sse.js');
      
      const transport = new SSEClientTransport(
        new URL('https://automation.evolvededen.com/mcp-server/http'),
        {
          headers: { Authorization: `Bearer ${process.env.N8N_MCP_TOKEN}` },
          requestInit: { headers: { Authorization: `Bearer ${process.env.N8N_MCP_TOKEN}` } },
        }
      );
      
      const client = new Client(
        { name: 'tool-checker', version: '1.0.0' },
        { capabilities: {} }
      );
      
      await client.connect(transport);
      const toolsResult = await client.listTools();
      console.log('Tools:', JSON.stringify(toolsResult, null, 2));
      
      await client.close();
    } catch(e2) {
      console.error('MCP SDK error:', e2.message);
    }
  }
}

main().catch(e => { console.error('FATAL:', e); process.exit(1); });
