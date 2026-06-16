$password = "Shemeca2027#"
$hostname = "148.230.86.150"

# Create temp python script that will be uploaded
$pythonScript = @"
import sys, os
schedule_path = sys.argv[1]
print(f"Patching: {schedule_path}")

with open(schedule_path, 'r') as f:
    content = f.read()

old = "const { interval: intervals } = this.getNodeParameter('rule', []);"
new = """const ruleParam_patched = this.getNodeParameter('rule', []);
process.stderr.write('[SCHEDULE_DEBUG] rule param: ' + JSON.stringify(ruleParam_patched) + '\\n');
const { interval: intervals } = ruleParam_patched;
process.stderr.write('[SCHEDULE_DEBUG] intervals: ' + JSON.stringify(intervals) + '\\n');
if (intervals === undefined || intervals === null) {
    process.stderr.write('[SCHEDULE_DEBUG] intervals is undefined!\\n');
}"""

count = content.count(old)
if count == 0:
    # Try alternate quoting
    old = "const { interval: intervals } = this.getNodeParameter(\"rule\", []);"
    count = content.count(old)

if count == 0:
    print("ERROR: Could not find target code!")
    # Show surrounding context
    idx = content.find("getNodeParameter('rule'")
    if idx >= 0:
        print("Found near:", content[idx-20:idx+80])
    else:
        idx = content.find("getNodeParameter")
        if idx >= 0:
            print("Found getNodeParameter near:", content[idx:idx+100])
        else:
            print("getNodeParameter not found anywhere in file")
    sys.exit(1)

content = content.replace(old, new)
with open(schedule_path, 'w') as f:
    f.write(content)
print(f"Patched {count} occurrences")
"@

$pythonScript | Set-Content -Path "$env:TEMP\patch_schedule.py" -Encoding Ascii

# Copy script to remote
wsl --exec bash -c "sshpass -p '$password' scp -o StrictHostKeyChecking=no /mnt/host/c/Users/evolv/AppData/Local/Temp/patch_schedule.py root@$hostname:/tmp/patch_schedule.py 2>&1"
if ($LASTEXITCODE -ne 0) { Write-Host "SCP failed"; exit 1 }

# Run on remote
wsl --exec bash -c "sshpass -p '$password' ssh -o StrictHostKeyChecking=no root@$hostname \"docker exec --user root n8n bash -c 'SCHEDULE=\\\$(find /usr/local/lib/node_modules/n8n/node_modules/.pnpm/n8n-nodes-base*/node_modules/n8n-nodes-base/dist/nodes/Schedule/ScheduleTrigger.node.js 2>/dev/null | head -1); echo Trigger file: \\\$SCHEDULE; [ -f \\\"\\\${SCHEDULE}.bak\\\" ] || cp \\\"\\\$SCHEDULE\\\" \\\"\\\${SCHEDULE}.bak\\\"; python3 /tmp/patch_schedule.py \\\"\\\$SCHEDULE\\\"'\" 2>&1"
