#!/bin/sh
sshpass -p "Shemeca2027#" ssh -o StrictHostKeyChecking=no root@148.230.86.150 "bash -s" << 'EOF'
# Find the ActiveWorkflows class
docker exec --user root n8n grep -n "ActiveWorkflows\|class ActiveWork" /usr/local/lib/node_modules/n8n/dist/services/active-workflows.service.js 2>/dev/null | head -5
echo "==="
# Check what activeWorkflows is instantiated with
docker exec --user root n8n grep -n "activeWorkflows\|ActiveWorkflows" /usr/local/lib/node_modules/n8n/dist/active-workflow-manager.js 2>/dev/null | head -10
EOF
