#!/bin/sh
sshpass -p "Shemeca2027#" ssh -o StrictHostKeyChecking=no root@148.230.86.150 "bash -s" << 'EOF'
# Search for where Zod validation happens during activation
docker exec --user root n8n grep -rn "\.parse\|\.safeParse\|schema" /usr/local/lib/node_modules/n8n/node_modules/.pnpm/n8n-workflow@file+packages+workflow_zod@3.25.67/node_modules/n8n-workflow/dist/cjs/workflow.js 2>/dev/null | head -10
echo "---"
# Also check Workflow constructor for validation
docker exec --user root n8n sed -n '77,110p' /usr/local/lib/node_modules/n8n/node_modules/.pnpm/n8n-workflow@file+packages+workflow_zod@3.25.67/node_modules/n8n-workflow/dist/cjs/workflow.js 2>/dev/null
EOF
