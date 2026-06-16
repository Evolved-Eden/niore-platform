#!/bin/sh
sshpass -p "Shemeca2027#" ssh -o StrictHostKeyChecking=no root@148.230.86.150 "bash -s" << 'EOF'
# Check the add method of active-workflow-manager more carefully around triggers
docker exec --user root n8n sed -n '465,495p' /usr/local/lib/node_modules/n8n/dist/active-workflow-manager.js 2>/dev/null
echo "==="
# Check how addTriggersAndPollers calls into active-workflows 
docker exec --user root n8n grep -n "addTriggersAndPollers\|getTriggerFunctions\|getPollFunctions" /usr/local/lib/node_modules/n8n/dist/active-workflow-manager.js 2>/dev/null
EOF
