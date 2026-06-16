#!/bin/sh
sshpass -p "Shemeca2027#" ssh -o StrictHostKeyChecking=no root@148.230.86.150 "bash -s" << 'EOF'
docker exec --user root n8n grep -n "\.map(" /usr/local/lib/node_modules/n8n/node_modules/.pnpm/n8n-workflow@file+packages+workflow_zod@3.25.67/node_modules/n8n-workflow/dist/cjs/node-helpers.js 2>/dev/null | head -10
echo "---"
docker exec --user root n8n grep -n "\.map(" /usr/local/lib/node_modules/n8n/node_modules/.pnpm/n8n-workflow@file+packages+workflow_zod@3.25.67/node_modules/n8n-workflow/dist/cjs/workflow.js 2>/dev/null | head -10
echo "---"
# Also look at the telemetry helpers
docker exec --user root n8n grep -n "\.map(" /usr/local/lib/node_modules/n8n/node_modules/.pnpm/n8n-workflow@file+packages+workflow_zod@3.25.67/node_modules/n8n-workflow/dist/cjs/telemetry-helpers.js 2>/dev/null | head -10
EOF
