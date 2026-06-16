#!/bin/sh
sshpass -p "Shemeca2027#" ssh -o StrictHostKeyChecking=no root@148.230.86.150 "bash -s" << 'EOF'
# Find the ActiveWorkflows service class
docker exec --user root n8n grep -n "async add(" /usr/local/lib/node_modules/n8n/dist/services/active-workflows.service.js 2>/dev/null | head -5
EOF
