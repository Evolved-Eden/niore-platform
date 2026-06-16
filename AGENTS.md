<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:ecosystem-context -->
# Evolved Ecosystem

This project is part of a multi-project ecosystem. Open `C:\Users\evolv\evolved-ecosystem.code-workspace` in VS Code to see all projects.

## Projects in the ecosystem

| Project | Path | Purpose |
|---|---|---|
| **hoodacity** (main) | `C:\Users\evolv\hoodacity` | Next.js blog with Supabase, Stripe, AI agents, MCP servers |
| **ai-video-studio** | `C:\Users\evolv\ai-video-studio` | Local video/voice rendering pipeline using ffmpeg |

## Custom Agents Available

| Agent | Purpose |
|---|---|
| `@media-pipeline` | Video/voice rendering with ffmpeg (ai-video-studio) |
| `@social-manager` | Discord messaging & social media posting via MCP |

Call them in your prompt: `@media-pipeline render this video...` or `@social-manager post to Discord...`

## MCP Servers Configured

| Server | Status | Purpose |
|---|---|---|
| **n8n** | ✅ Enabled | Workflow automation — bridge dashboard → Discord → social media |
| **GitHub** | ✅ Enabled | Repository management |
| **Supabase** | ✅ Enabled | Database & auth operations |
| **Stripe** | ✅ Enabled | Payment operations |
| **Discord** | ⚠️ Disabled | Enable when `DISCORD_BOT_TOKEN` is set (94 tools) |
| **PostEverywhere** | ⚠️ Disabled | Enable when `POST_EVERYWHERE_API_KEY` is set (8 social platforms) |
| **Composio** | ⚠️ Disabled | 1000+ app integrations via single MCP endpoint |
<!-- END:ecosystem-context -->
