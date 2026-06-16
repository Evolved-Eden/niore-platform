#!/bin/sh
sshpass -p "Shemeca2027#" ssh -o StrictHostKeyChecking=no root@148.230.86.150 "bash -s" << 'EOF'
docker exec --user root n8n sed -n '682,750p' /usr/local/lib/node_modules/n8n/dist/active-workflow-manager.js
EOF
