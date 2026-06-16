/**
 * SSH into VPS using node-ssh with debugging
 */
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { NodeSSH } from "node-ssh";

const __dirname = dirname(fileURLToPath(import.meta.url));

async function main() {
  console.log("🔌 Connecting to VPS...\n");
  
  const ssh = new NodeSSH();
  
  try {
    const result = await ssh.connect({
      host: "148.230.86.150",
      port: 22,
      username: "evolved-eden",
      password: "Shemeca2027#",
      readyTimeout: 10000,
      // Try keyboard-interactive auth as well
      tryKeyboard: true,
      // Enable keepalive
      keepaliveInterval: 5000,
      keepaliveCountMax: 3,
    });
    
    console.log("✅ Connected!\n");

    // Try sudo commands
    let cmds = [
      "whoami",
      "id",
      "sudo -n echo 'sudo_ok' 2>/dev/null || echo 'no_passwordless_sudo'",
      "docker ps --filter name=n8n --format '{{.ID}} {{.Image}} {{.Status}}' 2>/dev/null || echo 'no_docker'",
      "ps aux | grep -E '[n]8n|[n]ode.*n8n' | head -10",
      "ss -tlnp | grep 5678 || echo 'nothing_on_5678'",
    ];

    for (const cmd of cmds) {
      console.log(`$ ${cmd}`);
      let resp;
      try {
        resp = await ssh.execCommand(cmd, { timeout: 5000 });
      } catch(e) {
        resp = { stdout: '', stderr: `ERROR: ${e.message}` };
      }
      if (resp.stdout) console.log(resp.stdout);
      if (resp.stderr) console.log(`  stderr: ${resp.stderr}`);
      console.log("");
    }

    console.log("✨ Basic info gathered!");
    
    // Now check n8n config
    console.log("\n📋 Checking n8n config files...");
    try {
      let home = await ssh.execCommand("echo HOME is $HOME");
      console.log(home.stdout);
      
      let ls = await ssh.execCommand("ls -la ~/.n8n/ 2>/dev/null; echo EXIT:$?");
      console.log(ls.stdout);
    } catch(e) {
      console.log(`Error: ${e.message}`);
    }

  } catch (err) {
    console.error("❌ Connection failed:", err.message);
    console.error(err);
    process.exit(1);
  } finally {
    ssh.dispose();
  }
}

main();
