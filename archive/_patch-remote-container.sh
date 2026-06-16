#!/bin/sh
# This script runs on the remote server via SSH
set -e

CJS=$(docker exec --user root n8n find /usr/local/lib -name node-helpers.js -path "*/n8n-workflow/dist/cjs/*" 2>/dev/null | head -1)
ESM=$(docker exec --user root n8n find /usr/local/lib -name node-helpers.js -path "*/n8n-workflow/dist/esm/*" 2>/dev/null | head -1)

echo "CJS=[$CJS]"
echo "ESM=[$ESM]"

if [ -n "$CJS" ]; then
  docker exec --user root n8n cp "$CJS" /tmp/nh-cjs.js
  docker exec --user root n8n sed -i 's/for (const nodeValue of propertyValues\[itemName\]) {/if (!Array.isArray(propertyValues[itemName])) { continue; }\n                    for (const nodeValue of propertyValues[itemName]) {/' /tmp/nh-cjs.js
  docker exec --user root n8n cp /tmp/nh-cjs.js "$CJS"
  echo "CJS patched OK"
  docker exec --user root n8n grep "Array.isArray" "$CJS"
fi

if [ -n "$ESM" ]; then
  docker exec --user root n8n cp "$ESM" /tmp/nh-esm.js
  docker exec --user root n8n sed -i 's/for (const nodeValue of propertyValues\[itemName\]) {/if (!Array.isArray(propertyValues[itemName])) { continue; }\n                    for (const nodeValue of propertyValues[itemName]) {/' /tmp/nh-esm.js
  docker exec --user root n8n cp /tmp/nh-esm.js "$ESM"
  echo "ESM patched OK"
  docker exec --user root n8n grep "Array.isArray" "$ESM"
fi

echo "ALL_DONE"
