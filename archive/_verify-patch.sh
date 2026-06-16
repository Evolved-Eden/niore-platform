#!/bin/sh
sshpass -p "Shemeca2027#" ssh -o StrictHostKeyChecking=no root@148.230.86.150 "bash -s" << 'EOF'
docker exec --user root n8n grep -c "Array.isArray(propertyValues\[itemName\])" /usr/local/lib/node_modules/n8n/node_modules/.pnpm/n8n-workflow@file+packages+workflow_zod@3.25.67/node_modules/n8n-workflow/dist/cjs/node-helpers.js
docker exec --user root n8n grep -c "Array.isArray(propertyValues\[itemName\])" /usr/local/lib/node_modules/n8n/node_modules/.pnpm/n8n-workflow@file+packages+workflow_zod@3.25.67/node_modules/n8n-workflow/dist/esm/node-helpers.js
EOF
