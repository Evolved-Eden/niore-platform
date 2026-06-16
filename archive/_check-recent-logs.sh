#!/bin/sh
sshpass -p "Shemeca2027#" ssh -o StrictHostKeyChecking=no root@148.230.86.150 "bash -s" << 'EOF'
docker logs n8n --tail 100 2>&1 | grep -i "error\|workflow.*fail\|execution.*error\|queue\|WF1\|queue.*poller\|8608" | tail -20
EOF
