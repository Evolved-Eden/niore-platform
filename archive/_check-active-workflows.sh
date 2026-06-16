#!/bin/sh
sshpass -p "Shemeca2027#" ssh -o StrictHostKeyChecking=no root@148.230.86.150 "bash -s" << 'EOF'
docker exec --user root n8n find /usr/local/lib/node_modules/n8n/dist -name "active-workflows*" -not -name "*.map" 2>/dev/null
echo "---"
# Check the activeWorkflows.add method
docker exec --user root n8n grep -n "async add(" /usr/local/lib/node_modules/n8n/dist/active-workflow-manager.js 2>/dev/null
EOF
