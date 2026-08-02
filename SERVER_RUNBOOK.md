# Hetzner + Coolify Server Runbook

Recovery and hardening steps for the box running Coolify and the Niore platform.
Run everything as `root` (or prefix with `sudo`).

---

## 0. First, confirm the machine size

The plan name matters a lot for the memory diagnosis:

| Plan  | vCPU | RAM  | Disk  |
|-------|------|------|-------|
| CX32  | 4    | 8 GB | 80 GB |
| CCX33 | 8    | 32 GB| 240 GB|

```bash
free -h
nproc
df -h /
```

- **8 GB** → building on the server was almost certainly the cause of the crashes. Sections 1–3 are mandatory.
- **32 GB** → memory is less likely to be the trigger. Still do sections 2–5, and check `dmesg -T | grep -i "out of memory"` before assuming OOM.

---

## 1. Stop building on the server

This is the root fix. `.github/workflows/deploy.yml` now builds the image on
GitHub's runners and pushes it to GHCR; the server only pulls and runs it.

### 1a. Add GitHub repository secrets

**Settings → Secrets and variables → Actions → New repository secret.**

Build args (values come from your local `.env`):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_SERVICES_URL`
- `NEXT_PUBLIC_EXCHANGE_URL`
- `NEXT_PUBLIC_SENTRY_DSN`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`

Deploy trigger:

- `COOLIFY_WEBHOOK_URL`
- `COOLIFY_API_TOKEN`

> `NEXT_PUBLIC_*` values end up in the browser bundle by design — they are not
> secret. They live in GitHub Secrets only for convenience. `SUPABASE_SERVICE_ROLE_KEY`
> and `RESEND_API_KEY` **are** secret and must never be referenced from client code.

### 1b. Point Coolify at the registry image

In Coolify, for the Niore app:

1. Change the build pack from **Dockerfile / Nixpacks** to **Docker Image**.
2. Image: `ghcr.io/<your-org>/<your-repo>:latest`
3. If the GHCR package is private, add a registry credential in Coolify
   (**Keys & Tokens → Registries**) using a GitHub PAT with `read:packages`.
4. Copy the app's **Webhook URL** and API token into the GitHub secrets above.

### 1c. Make the package pullable

By default GHCR packages are private. Either add the credential above, or open
the package: **GitHub → your profile → Packages → the package → Package settings
→ Change visibility → Public**.

---

## 2. Add swap

Cheap insurance against the OOM killer taking down Docker. Do this even on the
32 GB box.

```bash
fallocate -l 8G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
free -h          # verify swap now shows
```

Lower the swappiness so it is used as a safety net rather than routinely:

```bash
echo 'vm.swappiness=10' > /etc/sysctl.d/99-swappiness.conf
sysctl --system
```

---

## 3. Cap Docker logs

Unbounded container logs are the most common cause of a Coolify box filling its
disk. Docker does **not** rotate them by default.

```bash
mkdir -p /etc/docker
cat > /etc/docker/daemon.json <<'EOF'
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
EOF

systemctl restart docker
```

> This applies to containers created **after** the restart. Existing containers
> keep their old settings until recreated — a redeploy handles that.

Also cap the systemd journal:

```bash
journalctl --vacuum-size=200M
sed -i 's/^#SystemMaxUse=.*/SystemMaxUse=200M/' /etc/systemd/journald.conf
systemctl restart systemd-journald
```

---

## 4. Automatic security updates

This clears the "100 updates can be applied immediately" MOTD and keeps it clear.

```bash
apt update
apt install -y unattended-upgrades apt-listchanges
dpkg-reconfigure -plow unattended-upgrades
```

Then enable it explicitly:

```bash
cat > /etc/apt/apt.conf.d/20auto-upgrades <<'EOF'
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
APT::Periodic::AutocleanInterval "7";
EOF
```

Apply the current backlog once, by hand, so you are starting from a clean state:

```bash
apt update && apt upgrade -y
apt autoremove -y
```

### Automatic reboots — decide deliberately

Kernel updates need a reboot to take effect. Unattended reboots on a production
box are a real trade-off: patched faster, but the server can restart at 3am
mid-request.

To enable, edit `/etc/apt/apt.conf.d/50unattended-upgrades`:

```
Unattended-Upgrade::Automatic-Reboot "true";
Unattended-Upgrade::Automatic-Reboot-Time "04:00";
```

Leave it `"false"` if you would rather reboot manually. Check whether a reboot
is pending at any time:

```bash
[ -f /var/run/reboot-required ] && cat /var/run/reboot-required
```

---

## 5. Ubuntu Pro / Expanded Security Maintenance

ESM is the "expanded security maintenance not enabled" line in the MOTD. It
extends security patching to the `universe` repo and to LTS releases past their
standard window. **Ubuntu Pro is free for personal and small-business use on up
to 5 machines.**

1. Get a token at <https://ubuntu.com/pro/dashboard>
2. Attach:

```bash
pro attach <YOUR_TOKEN>
pro status
```

3. Enable the security services:

```bash
pro enable esm-infra
pro enable esm-apps
apt update && apt upgrade -y
```

Optional, and worth considering separately — kernel patching without reboots:

```bash
pro enable livepatch
```

---

## 6. Weekly cleanup cron (safe)

Keeps disk usage flat without the volume-destroying flags.

```bash
cat > /etc/cron.weekly/docker-cleanup <<'EOF'
#!/bin/sh
# Reclaim build cache and images unused for 7+ days.
# Deliberately does NOT use --volumes: that deletes database data.
docker image prune -af --filter "until=168h"
docker builder prune -af --filter "until=168h"
journalctl --vacuum-time=14d
EOF

chmod +x /etc/cron.weekly/docker-cleanup
```

> **Never run `docker system prune -a --volumes` on this box.** It removes
> stopped containers first, then deletes any volume nothing references — which
> includes `coolify-db` whenever Docker is down or containers are stopped. That
> is what destroyed the Coolify database previously.

---

## 7. Enable Hetzner backups

The single highest-value item on this list. In the Hetzner Cloud console:
**Server → Backups → Enable**. Roughly 20% of the server cost, and it turns a
rebuild-from-scratch into a ten-minute rollback.

Take a manual snapshot now, once everything is healthy and verified:
**Server → Snapshots → Take snapshot**.

---

## 8. Close the exposed Postgres port

`docker-compose.yml` publishes Postgres on all interfaces:

```yaml
ports:
  - "5432:5432"
```

`docker-compose.prod.yml` overrides this with `ports: []`, but **only if both
files are passed**. Always deploy that stack with both:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

Verify nothing is listening publicly:

```bash
ss -tlnp | grep -E '5432|5678|5050'
```

You want these bound to `127.0.0.1` or absent — not `0.0.0.0`. If Postgres is
publicly reachable, treat `POSTGRES_PASSWORD` as compromised and rotate it.

A firewall is the belt-and-braces version. In the Hetzner console
(**Firewalls**), allow inbound only on `22`, `80`, and `443`. Doing it at the
Hetzner level rather than with `ufw` avoids the well-known conflict where Docker
writes its own iptables rules that bypass `ufw`.

---

## 9. Health check after any recovery

```bash
free -h                                   # swap present
df -h / && df -i /                        # disk and inodes healthy
docker ps                                 # coolify, coolify-db, coolify-redis, coolify-realtime
docker logs coolify --tail 50             # no restart loop
dmesg -T | grep -i "out of memory" | tail # should be quiet
ss -tlnp | grep -E '5432|5678'            # no public database ports
pro status                                # ESM enabled
```

---

## Rollout order

1. Section 7 — enable backups (do this **first**, before changing anything else)
2. Section 2 — swap
3. Section 3 — Docker log caps + journal caps
4. Section 4 — unattended upgrades
5. Section 5 — Ubuntu Pro / ESM
6. Section 6 — weekly cleanup cron
7. Section 1 — move builds to GitHub Actions
8. Section 8 — close the Postgres port
9. Section 9 — verify, then take a fresh snapshot
