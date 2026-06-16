#!/bin/sh
sshpass -p "Shemeca2027#" ssh -o StrictHostKeyChecking=no root@148.230.86.150 "bash -s" << 'EOF'
docker exec --user root n8n find /usr/local/lib/node_modules/n8n -path "*/ScheduleTrigger*" -name "*.js" -not -name "*.map" 2>/dev/null | head -5
echo "---"
docker exec --user root n8n find /usr/local/lib/node_modules/n8n -path "*/scheduleTrigger*" -name "*.js" -not -name "*.map" 2>/dev/null | head -5
EOF
