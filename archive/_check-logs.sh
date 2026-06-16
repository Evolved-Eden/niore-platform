#!/bin/sh
sshpass -p "Shemeca2027#" ssh -o StrictHostKeyChecking=no root@148.230.86.150 "bash -s" << 'EOF'
docker logs n8n --tail 30 2>&1 | grep -i "error\|unknown\|filter" | tail -15
EOF
