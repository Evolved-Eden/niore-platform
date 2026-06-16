#!/bin/sh
sshpass -p "Shemeca2027#" ssh -o StrictHostKeyChecking=no root@148.230.86.150 "bash -s" << 'EOF'
docker logs n8n --tail 50 2>&1 | grep -i "error\|typeerror\|WF1\|queue\|9280\|9262\|Cannot read" | tail -20
EOF
