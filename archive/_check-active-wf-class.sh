#!/bin/sh
sshpass -p "Shemeca2027#" ssh -o StrictHostKeyChecking=no root@148.230.86.150 "bash -s" << 'EOF'
# Find where ActiveWorkflows is defined 
docker exec --user root n8n find /usr/local/lib/node_modules/n8n -name "active-workflows*" -not -name "*.map" 2>/dev/null | head -5
echo "==="
docker exec --user root n8n grep -n "constructor\|async add(" /usr/local/lib/node_modules/n8n/dist/workflows/active-workflows.js 2>/dev/null | head -5
EOF
