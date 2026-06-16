#!/bin/sh
sshpass -p "Shemeca2027#" ssh -o StrictHostKeyChecking=no root@148.230.86.150 "bash -s" << 'EOF'
docker exec --user root n8n find /usr/local/lib/node_modules/n8n/node_modules/.pnpm/n8n-nodes-base*/node_modules/n8n-nodes-base/dist/nodes/Schedule/ -name "GenericFunctions*" 2>/dev/null
EOF
