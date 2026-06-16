#!/bin/sh
sshpass -p "Shemeca2027#" ssh -o StrictHostKeyChecking=no root@148.230.86.150 "bash -s" << 'EOF'
docker exec --user root n8n grep -n "async add(" /usr/local/lib/node_modules/n8n/node_modules/.pnpm/n8n-core@file+packages+core_@opentelemetry+api@1.9.0_@opentelemetry+exporter-trace-otlp_ce638e8b29a9b41efb156b4b4f9f9f93/node_modules/n8n-core/dist/execution-engine/active-workflows.js 2>/dev/null
echo "==="
docker exec --user root n8n sed -n "$(docker exec --user root n8n grep -n "async add(" /usr/local/lib/node_modules/n8n/node_modules/.pnpm/n8n-core@file+packages+core_@opentelemetry+api@1.9.0_@opentelemetry+exporter-trace-otlp_ce638e8b29a9b41efb156b4b4f9f9f93/node_modules/n8n-core/dist/execution-engine/active-workflows.js 2>/dev/null | head -1 | cut -d: -f1),+50p" /usr/local/lib/node_modules/n8n/node_modules/.pnpm/n8n-core@file+packages+core_@opentelemetry+api@1.9.0_@opentelemetry+exporter-trace-otlp_ce638e8b29a9b41efb156b4b4f9f9f93/node_modules/n8n-core/dist/execution-engine/active-workflows.js 2>/dev/null
EOF
