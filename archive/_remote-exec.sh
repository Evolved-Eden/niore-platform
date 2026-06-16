#!/bin/sh
CONTAINER=$(docker ps --format '{{.Names}}' | grep -i n8n | head -1)
echo "Container: $CONTAINER"

FILE=$(find /usr/local/lib/node_modules/n8n/node_modules/.pnpm -path "*/n8n-workflow/dist/cjs/node-helpers.js" 2>/dev/null | head -1)
ESM_FILE=$(find /usr/local/lib/node_modules/n8n/node_modules/.pnpm -path "*/n8n-workflow/dist/esm/node-helpers.js" 2>/dev/null | head -1)

echo "CJS: $FILE"
echo "ESM: $ESM_FILE"

if [ -n "$FILE" ]; then
  docker exec --user root $CONTAINER cp "$FILE" /tmp/nh-cjs.js
  docker exec --user root $CONTAINER sed -i 's/for (const nodeValue of propertyValues\[itemName\]) {/if (!Array.isArray(propertyValues[itemName])) { continue; }\
                    for (const nodeValue of propertyValues[itemName]) {/' /tmp/nh-cjs.js
  docker exec --user root $CONTAINER cp /tmp/nh-cjs.js "$FILE"
  echo "CJS patched"
fi

if [ -n "$ESM_FILE" ]; then
  docker exec --user root $CONTAINER cp "$ESM_FILE" /tmp/nh-esm.js
  docker exec --user root $CONTAINER sed -i 's/for (const nodeValue of propertyValues\[itemName\]) {/if (!Array.isArray(propertyValues[itemName])) { continue; }\
                    for (const nodeValue of propertyValues[itemName]) {/' /tmp/nh-esm.js
  docker exec --user root $CONTAINER cp /tmp/nh-esm.js "$ESM_FILE"
  echo "ESM patched"
fi

echo "Done"
