#!/bin/sh
FILE="/usr/local/lib/node_modules/n8n/node_modules/.pnpm/n8n-workflow@file+packages+workflow_zod@3.25.67/node_modules/n8n-workflow/dist/cjs/node-helpers.js"
# Add null check before the for-of loop at line 761
sed -i 's/for (const nodeValue of propertyValues\[itemName\]) {/if (propertyValues[itemName] === undefined || propertyValues[itemName] === null || !Array.isArray(propertyValues[itemName])) { continue; }\n                    for (const nodeValue of propertyValues[itemName]) {/' "$FILE"
echo "Patch applied to $FILE"
sed -n '760,765p' "$FILE"
