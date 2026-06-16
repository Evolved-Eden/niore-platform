#!/bin/sh
sshpass -p "Shemeca2027#" ssh -o StrictHostKeyChecking=no root@148.230.86.150 "bash -s" << 'EOF'
docker exec --user root n8n grep -n "getErrorNodeId\|getNodeId\|nodeId" /usr/local/lib/node_modules/n8n/node_modules/.pnpm/n8n-workflow@file+packages+workflow_zod@3.25.67/node_modules/n8n-workflow/dist/cjs/utils.js 2>/dev/null | head -10
echo "---"
docker exec --user root n8n grep -n "getErrorNodeId" /usr/local/lib/node_modules/n8n/dist/workflows/workflow.service.js 2>/dev/null
EOF
