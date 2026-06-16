#!/bin/sh
FILE="/usr/local/lib/node_modules/n8n/node_modules/.pnpm/n8n-workflow@file+packages+workflow_zod@3.25.67/node_modules/n8n-workflow/dist/cjs/node-helpers.js"
echo "Before:"
sed -n '759,762p' "$FILE"
echo ""
echo "Applying patch..."
sed -i 's/for (const nodeValue of propertyValues\[itemName\]) {/if (propertyValues[itemName] === undefined || propertyValues[itemName] === null || !Array.isArray(propertyValues[itemName])) { continue; }\
                    for (const nodeValue of propertyValues[itemName]) {/' "$FILE"
echo ""
echo "After:"
sed -n '759,770p' "$FILE"
