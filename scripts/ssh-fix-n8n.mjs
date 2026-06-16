/**
 * SSH into VPS to fix n8n, check logs, restart, and import workflows
 * 
 * Run: node scripts/ssh-fix-n8n.mjs
 */
import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { Client } from "ssh2";

const __dirname = dirname(fileURLToPath(import.meta.url));

const SSH_HOST = "148.230.86.150";
const SSH_USER = "evolved-eden";
const SSH_PASSWORD = "Shemeca2027$";

function sshExec(client, command, opts = {}) {
  return new Promise((resolve, reject) => {
    client.exec(command, opts, (err, stream) => {
      if (err) return reject(err);
      let stdout = "";
      let stderr = "";
      stream.on("close", (code) => resolve({ code, stdout, stderr }));
      stream.on("data", (data) => (stdout += data.toString()));
      stream.stderr.on("data", (data) => (stderr += data.toString()));
    });
  });
}

async function main() {
  console.log("🔌 Connecting to VPS...");
  const client = new Client();

  await new Promise((resolve, reject) => {
    client.on("ready", () => {
      console.log("✅ Connected to VPS\n");
      resolve();
    });
    client.on("error", (err) => reject(err));
    client.on("keyboard-interactive", (name, instructions, lang, prompts, finish) => {
      finish([SSH_PASSWORD]);
    });
    client.connect({
      host: SSH_HOST,
      port: 22,
      username: SSH_USER,
      password: SSH_PASSWORD,
      readyTimeout: 10000,
      tryKeyboard: true,
    });
  });

  try {
    // First, try to sudo to root for diagnostics and fixes
    console.log("📋 Checking system info...\n");

    // 1. How is n8n running?
    let dockerCheck = await sshExec(client, "sudo docker ps --filter name=n8n --format '{{.ID}} {{.Image}} {{.Status}}' 2>/dev/null || docker ps --filter name=n8n --format '{{.ID}} {{.Image}} {{.Status}}' 2>/dev/null");
    if (dockerCheck.stdout.trim()) console.log(`Docker: ${dockerCheck.stdout}`);
    else console.log("  No n8n docker container found");

    // 2. Check PM2
    let pm2Check = await sshExec(client, "pm2 list 2>/dev/null | head -20");
    if (pm2Check.stdout.trim()) console.log(`\nPM2 processes:\n${pm2Check.stdout}`);
    else console.log("  No PM2 found");

    // 3. Check for n8n process
    let psResult = await sshExec(client, "ps aux | grep -E '[n]8n|[n]ode.*n8n' | head -10");
    console.log(`\n📋 n8n processes:\n${psResult.stdout || "  None found"}`);

    // 4. Check what's on port 5678
    let portResult = await sshExec(client, "ss -tlnp | grep 5678 || sudo ss -tlnp | grep 5678");
    console.log(`\n📋 Port 5678:\n${portResult.stdout || "  Nothing on 5678"}`);

    // 5. Check n8n config
    let n8nConfig = await sshExec(client, "ls -la ~/.n8n/ 2>/dev/null; echo '---'; cat ~/.n8n/config 2>/dev/null || echo 'No config file'");
    console.log(`\n📋 n8n config:\n${n8nConfig.stdout}`);

    // 6. Check nginx config
    let nginxFind = await sshExec(client, "sudo find /etc/nginx -name '*.conf' -type f | xargs grep -l 'n8n\\|automation\\|5678' 2>/dev/null");
    console.log(`\n📋 nginx configs mentioning n8n:\n${nginxFind.stdout || "  None found"}`);

    if (nginxFind.stdout.trim()) {
      for (const confFile of nginxFind.stdout.trim().split('\n')) {
        let conf = await sshExec(client, `sudo cat "${confFile}"`);
        console.log(`\n--- ${confFile} ---\n${conf.stdout}`);
      }
    }

    // 7. Check n8n logs
    let logs = await sshExec(client, "sudo find / -path '*/n8n*.log' -type f 2>/dev/null | head -5");
    console.log(`\n📋 n8n log files:\n${logs.stdout || "  None found"}`);

    // 8. Check journalctl for n8n
    let journal = await sshExec(client, "sudo journalctl -u n8n --no-pager -n 50 2>/dev/null || echo 'No systemd service'");
    console.log(`\n📋 Journalctl logs:\n${journal.stdout}`);

    // 9. Check sudo access
    let sudoCheck = await sshExec(client, "sudo -n echo 'has_sudo' 2>/dev/null || echo 'no_passwordless_sudo'");
    console.log(`\n📋 Sudo status: ${sudoCheck.stdout.trim()}`);

    // 10. Check disk space and memory
    let df = await sshExec(client, "df -h / | tail -1");
    let mem = await sshExec(client, "free -h | grep Mem");
    console.log(`\n📋 Disk: ${df.stdout.trim()}`);
    console.log(`📋 Memory: ${mem.stdout.trim()}`);

    console.log("\n✨ Diagnostics complete!");
  } finally {
    client.end();
  }
}

main().catch((err) => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
