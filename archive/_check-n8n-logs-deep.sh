#!/bin/sh
sshpass -p "Shemeca2027#" ssh -o StrictHostKeyChecking=no root@148.230.86.150 docker logs n8n --tail 200 2>&1 | grep -v "n8n_plus\|Execution data\|optionally stored\|valid email\|Skipping\|n8n-session\|General\|engines\|Invalid email\|info.*encountered\|^$" | tail -100
