#!/bin/sh
# Step 1: Create the remote patch script
cat > /tmp/remote-do-patch.sh << "PATCHEOF"
#!/bin/sh
# Use a simpler find approach
CJS=$(find /usr/local/lib -name "node-helpers.js" -path "*/n8n-workflow/dist/cjs/*" 2>/dev/null | head -1)
ESM=$(find /usr/local/lib -name "node-helpers.js" -path "*/n8n-workflow/dist/esm/*" 2>/dev/null | head -1)
echo "CJS=[$CJS]"
echo "ESM=[$ESM]"

if [ -n "$CJS" ]; then
  docker exec --user root n8n cp "$CJS" /tmp/nh-cjs.js
  docker exec --user root n8n sed -i 's/for (const nodeValue of propertyValues\[itemName\]) {/if (!Array.isArray(propertyValues[itemName])) { continue; }\n                    for (const nodeValue of propertyValues[itemName]) {/' /tmp/nh-cjs.js
  docker exec --user root n8n cp /tmp/nh-cjs.js "$CJS"
  echo "CJS patched"
  docker exec --user root n8n grep "Array.isArray" "$CJS"
fi
if [ -n "$ESM" ]; then
  docker exec --user root n8n cp "$ESM" /tmp/nh-esm.js
  docker exec --user root n8n sed -i 's/for (const nodeValue of propertyValues\[itemName\]) {/if (!Array.isArray(propertyValues[itemName])) { continue; }\n                    for (const nodeValue of propertyValues[itemName]) {/' /tmp/nh-esm.js
  docker exec --user root n8n cp /tmp/nh-esm.js "$ESM"
  echo "ESM patched"
  docker exec --user root n8n grep "Array.isArray" "$ESM"
fi
echo "ALLDONE"
PATCHEOF

# Copy to remote with scp
sshpass -p "Shemeca2027#" scp -o StrictHostKeyChecking=no /tmp/remote-do-patch.sh root@148.230.86.150:/tmp/

# Execute on remote
sshpass -p "Shemeca2027#" ssh -o StrictHostKeyChecking=no root@148.230.86.150 "sh /tmp/remote-do-patch.sh"
