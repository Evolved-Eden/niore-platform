#!/bin/sh
sshpass -p "Shemeca2027#" ssh -o StrictHostKeyChecking=no root@148.230.86.150 "bash -s" << 'EOF'
docker exec --user root n8n bash -c '
SCHEDULE=$(find /usr/local/lib/node_modules/n8n/node_modules/.pnpm/n8n-nodes-base*/node_modules/n8n-nodes-base/dist/nodes/Schedule/ScheduleTrigger.node.js 2>/dev/null | head -1)
echo "Trigger file: $SCHEDULE"

[ -f "${SCHEDULE}.bak" ] || cp "$SCHEDULE" "${SCHEDULE}.bak"

python3 -c "
import re
with open('$SCHEDULE', 'r') as f:
    content = f.read()

old = \"\"\"const { interval: intervals } = this.getNodeParameter('rule', []);\"\"\"
new = \"\"\"const ruleParam_patched = this.getNodeParameter('rule', []);
process.stderr.write('[SCHEDULE_DEBUG] rule param: ' + JSON.stringify(ruleParam_patched) + '\\n');
const { interval: intervals } = ruleParam_patched;
process.stderr.write('[SCHEDULE_DEBUG] intervals: ' + JSON.stringify(intervals) + '\\n');
if (intervals === undefined || intervals === null) {
    process.stderr.write('[SCHEDULE_DEBUG] intervals is undefined!\\n');
}\"\"\"

count = content.count(old)
if count == 0:
    # Try alternate form
    old2 = '''const { interval: intervals } = this.getNodeParameter(\"rule\", []);'''
    count = content.count(old2)
    if count > 0:
        content = content.replace(old2, new)
else:
    content = content.replace(old, new)

print(f'Patched {count} occurrences')
with open('$SCHEDULE', 'w') as f:
    f.write(content)
"
'
EOF
