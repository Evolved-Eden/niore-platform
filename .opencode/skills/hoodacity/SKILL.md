---
name: hoodacity
description: Use when working on the hoodacity Next.js blog project. Covers tech stack conventions for Next.js 16, Supabase, Stripe, AI SDK, Vercel KV, and Tailwind CSS.
---

# Hoodacity Project — Evolved Ecosystem

> This is part of the **Evolved Ecosystem** — multiple projects that form one unified system.
> Open the workspace file at `C:\Users\evolv\evolved-ecosystem.code-workspace` to see all projects together.

This project is a **Next.js blog** with the following tech stack. Follow these conventions when writing code.

## Sibling Projects

| Project | Path | Purpose |
|---|---|---|
| **hoodacity** (this) | `C:\Users\evolv\hoodacity` | Next.js blog with Supabase, Stripe, AI agents |
| **ai-video-studio** | `C:\Users\evolv\ai-video-studio` | Local video/voice rendering pipeline using ffmpeg |

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Database | Supabase (Postgres) |
| Payments | Stripe |
| AI | Vercel AI SDK (`ai` + `@ai-sdk/openai`) |
| Cache/Store | Vercel KV (Redis) |
| Auth | Supabase SSR auth (`@supabase/ssr`) |
| Styling | Tailwind CSS 3 + `tailwindcss-animate` |
| Animations | Framer Motion |
| Toasts | Sonner |
| Markdown | Streamdown (streaming markdown renderer) |
| Analytics | `@vercel/analytics` |

## Next.js 16 Conventions

- This is **not** the Next.js from your training data. Read `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
- App Router is used exclusively
- Use `next.config.mjs` for configuration
- ESLint uses `eslint.config.mjs` (flat config)

## Directory Structure

```
app/          — App Router pages and API routes
components/  — Shared React components
lib/          — Utility functions, client SDKs, helpers
scripts/      — One-off scripts and migrations
types/        — Shared TypeScript types
public/       — Static assets
```

## Coding Style

- TypeScript throughout, strict mode
- Tailwind CSS for styling (no CSS modules unless necessary)
- Prefer server components by default, add `'use client'` only when needed
- Use Supabase SSR client patterns from `@supabase/ssr`
- Environment variables in `.env.local`, referenced via `process.env.NEXT_PUBLIC_*` for public vars
