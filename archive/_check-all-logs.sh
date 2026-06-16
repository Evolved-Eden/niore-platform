#!/bin/sh
sshpass -p "Shemeca2027#" ssh -o StrictHostKeyChecking=no root@148.230.86.150 "bash -s" << 'EOF'
docker logs n8n --tail 200 2>&1 | grep -E "error|Error|TypeError|workflow.*fail|execution|trigger|9280|9262|9272|Running" | tail -30
EOF
