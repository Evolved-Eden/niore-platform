#!/bin/sh
sshpass -p "Shemeca2027#" ssh -o StrictHostKeyChecking=no root@148.230.86.150 "bash -s" << 'REMOTEEOF'
set -x
# Find the files directly on the host
CJS=$(find /usr/local/lib -name "node-helpers.js" -path "*/n8n-workflow/dist/cjs/*" 2>/dev/null | head -1)
ESM=$(find /usr/local/lib -name "node-helpers.js" -path "*/n8n-workflow/dist/esm/*" 2>/dev/null | head -1)
echo "CJS=[$CJS]"
echo "ESM=[$ESM]"

# If find fails, try from inside docker
if [ -z "$CJS" ]; then
  CJS=$(docker exec --user root n8n find /usr/local/lib -name "node-helpers.js" -path "*/n8n-workflow/dist/cjs/*" 2>/dev/null | head -1)
fi
if [ -z "$ESM" ]; then
  ESM=$(docker exec --user root n8n find /usr/local/lib -name "node-helpers.js" -path "*/n8n-workflow/dist/esm/*" 2>/dev/null | head -1)
fi
echo "INNER CJS=[$CJS]"
echo "INNER ESM=[$ESM]"

if [ -n "$CJS" ]; then
  docker exec --user root n8n cp "$CJS" /tmp/nh-cjs.js
  docker exec --user root n8n sed -i 's/for (const nodeValue of propertyValues\[itemName\]) {/if (!Array.isArray(propertyValues[itemName])) { continue; }\n                    for (const nodeValue of propertyValues[itemName]) {/' /tmp/nh-cjs.js
  docker exec --user root n8n cp /tmp/nh-cjs.js "$CJS"
  echo "CJS patched"
fi
if [ -n "$ESM" ]; then
  docker exec --user root n8n cp "$ESM" /tmp/nh-esm.js
  docker exec --user root n8n sed -i 's/for (const nodeValue of propertyValues\[itemName\]) {/if (!Array.isArray(propertyValues[itemName])) { continue; }\n                    for (const nodeValue of propertyValues[itemName]) {/' /tmp/nh-esm.js
  docker exec --user root n8n cp /tmp/nh-esm.js "$ESM"
  echo "ESM patched"
fi
echo "ALLDONE"
REMOTEEOF
