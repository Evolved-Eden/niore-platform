# 🧪 Evolved Eden — Production Launch Report Card

**Date:** 2026-06-07
**Project:** Hoodacity / Evolved Eden Intelligence Platform
**Scope:** Full production readiness diagnostics

---

## 📊 Overall Grade: **C+** (Conditional — see blockers)

| Area | Grade | Score | Key Issues |
|---|---|---|---|
| **Security** | **D** | 55% | 82 files with hardcoded Supabase ref; empty Docker passwords; hardcoded N8N encryption key |
| **Database** | **B** | 78% | Migrations solid but 2 unrun; gap at 00007; no RLS on evolved_eden tables |
| **Code Quality** | **C** | 65% | 143 unreferenced scripts; no tests; no error boundaries; no CI/CD |
| **Infrastructure** | **C** | 62% | Dockerfile good; no healthchecks; n8n unreachable; no monitoring |
| **Configuration** | **B** | 80% | Centralized config system; .env well structured; .gitignore solid |
| **Data Quality** | **C+** | 70% | CSV has 3 known integrity issues (swap, field counts, archetype ID 5 dup); no verification pipeline |

---

## 🔴 Grade Detail

### Security — D (55%)

**✅ Passed:**
- `.gitignore` covers `.env`, `node_modules/`, `.next/`, `.vercel/`
- `middleware.ts` protects admin API routes (+admin role check), client API routes, dashboard pages
- `.env.example` has proper placeholder values (no real secrets)
- Env vars well organized — 30 keys in `.env.local`
- No `process.env.*` fallback to real secrets in production code

**❌ Critical Failures:**
| Issue | Severity | Location | Fix |
|---|---|---|---|
| **82 files** hardcode `jebixydqpvsegvrtfmgm.supabase.co` | **HIGH** | `lib/db.ts:3`, `scripts/db.js:27`, 80+ scripts | Must use env var only; remove all fallback defaults |
| `POSTGRES_PASSWORD` blank in `docker-compose.yml:8` | **HIGH** | Compose file | Set via `${POSTGRES_PASSWORD}` env var |
| `PGADMIN_DEFAULT_PASSWORD` blank in `docker-compose.yml:53` | **HIGH** | Compose file | Set via env var |
| `N8N_ENCRYPTION_KEY` hardcoded as `evolved-eden-encryption-key-2026` | **MEDIUM** | `docker-compose.yml:34` | Move to env var |
| `scripts/final-verify.cjs:7` — Supabase ref hardcoded | **MEDIUM** | Script | Remove or env-var |
| `_clean-agents.js:3,42` — Supabase ref + REST URL hardcoded | **MEDIUM** | Root scripts | Remove or env-var |
| `_test-api-raw.js:3,48` — Same | **MEDIUM** | Root scripts | Remove or env-var |
| `scripts/deploy-wf-v2.mjs:12` — N8N_URL hardcoded `automation.evolvededen.com` | **LOW** | Script | Should be env var |

---

### Database — B (78%)

**✅ Passed:**
- 8 migrations (00002–00010), all have idempotent guards (`IF NOT EXISTS`, `ON CONFLICT DO NOTHING`)
- Full 128-archetype system in 00010 with proper FK to `evolved_eden_agents`
- Unified `agent_catalog` VIEW cross-references 3 agent tables
- Proper indexes on archetype_id, role_type, vertical, health_status
- RLS policies exist (from prior migrations: 00003, 00004)
- `lib/db.ts` uses connection pooling (max 10)

**❌ Issues:**
| Issue | Severity | Fix |
|---|---|---|
| Migrations 00005, 00006, 00008, 00009, 00010 not yet run | **HIGH** | Run in SQL Editor sequentially |
| Gap: 00007 is missing (jumps from 00006 to 00008) | **MEDIUM** | Verify nothing was lost |
| No RLS policies on `evolved_eden_agents` or `archetypes` tables | **MEDIUM** | Add RLS after migration |
| No `updated_at` trigger on `evolved_eden_agents` | **LOW** | Add trigger function |
| `agent_registry` FK references `agent_definitions`? Not verified | **MEDIUM** | Check FK relationships |
| `n8n` used `latest` tag in docker-compose (not pinned) | **LOW** | Pin to specific version |

---

### Code Quality — C (65%)

**✅ Passed:**
- TypeScript strict mode enabled (`strict: true`)
- Next.js 16 with App Router
- Centralized config system (`lib/config.ts`) with env var → DB → default priority
- Proper lazy imports in config system (`await import(...)`)
- Good error handling in import script (try/catch per row, connection cleanup)
- 11 API route groups organized by domain
- Modern ESLint 10 with `next/core-web-vitals` + TypeScript rules

**❌ Issues:**
| Issue | Severity | Fix |
|---|---|---|
| **0 test files** — no Jest/Vitest/Playwright config | **CRITICAL** | Add testing framework before prod |
| **0 error/loading/not-found pages** in app tree | **HIGH** | Add `error.tsx`, `not-found.tsx`, `loading.tsx` |
| **143 scripts** in `scripts/` — 80% are legacy one-offs | **HIGH** | Archive to `scripts/archive/`; keep only active |
| No `tsc` type-checking in `package.json` scripts | **MEDIUM** | Add `"typecheck": "tsc --noEmit"` |
| No `test` script in `package.json` | **MEDIUM** | Add test framework config |
| No `precommit` hooks (lint-staged, husky) | **LOW** | Add for lint+typecheck |
| `import-evolved-eden-400-agents.mjs` lacks transaction safety (no rollback) | **MEDIUM** | Add BEGIN/COMMIT/ROLLBACK |
| `deploy-wf-v2.mjs:` — two fallback paths with no clear winner | **LOW** | Clean up |
| Scripts inconsistently use `.mjs`, `.cjs`, `.js` extensions | **LOW** | Standardize to `.mjs` |

---

### Infrastructure — C (62%)

**✅ Passed:**
- Multi-stage Dockerfile (deps → builder → runner), node:22-alpine, ~150MB
- Standalone Next.js output mode (`output: 'standalone'`)
- Coolify-ready (USER nextjs, no root)
- Docker volumes for postgres, n8n, pgadmin data
- Healthcheck on postgres service

**❌ Issues:**
| Issue | Severity | Fix |
|---|---|---|
| **n8n unreachable** (`automation.evolvededen.com`) | **HIGH** | Fix DNS or update env |
| **No monitoring** (Sentry, OpenTelemetry, Logtail) | **HIGH** | Add error monitoring before prod |
| n8n image pinned to `:latest` | **MEDIUM** | Pin to specific version |
| No Docker healthcheck on n8n or pgadmin | **MEDIUM** | Add basic healthchecks |
| No CI/CD pipeline (GitHub Actions) | **MEDIUM** | Add basic CI |
| No `docker-compose.prod.yml` (dev/prod separation) | **MEDIUM** | Split configs |
| No `.env.production` template | **LOW** | Create |
| Docker Compose exposes pgadmin on port 5050 with no auth | **MEDIUM** | Lock down or remove |

---

### Configuration — B (80%)

**✅ Passed:**
- `.env.local` has 30 keys covering all services (Supabase, Stripe, AI providers, MCP, Discord)
- All API keys, tokens, URLs, Stripe price IDs present
- `.env.example` has proper placeholder values
- `.gitignore` covers `.env`, `.env*.local`, `.next`, `node_modules/`
- Next.js standalone mode configured
- Centralized config system allows DB-based config with env var override

**❌ Issues:**
| Issue | Severity | Fix |
|---|---|---|
| No `.env.production` or `.env.staging` templates | **LOW** | Create for deployment clarity |
| `N8N_MCP_URL`, `N8N_MCP_TOKEN` set but MCP may not be used | **LOW** | Verify connectivity |
| `NODE_ENV` in `.env.local` — should not be in version control | **LOW** | Document for deployment overrides |

---

### Data Quality — C+ (70%)

**✅ Passed:**
- Import script handles 3 known CSV integrity issues (column swap 225 rows, variable field counts 203 rows, multi-GEN entries 49 rows)
- Archetype system has proper numeric_id (1-128) with FK constraint
- `agent_catalog` VIEW unifies 3 separate agent tables
- Alignment reporter script (`align-agent-tables.mjs`) available

**❌ Issues:**
| Issue | Severity | Fix |
|---|---|---|
| **Archetype ID 5 duplicate**: "Caregiver" (primary) vs "Altruist" (AGT-353 only) | **MEDIUM** | Resolve duplicate; AGT-353 may need archetype 129 or alias |
| Only 37 of 128 archetypes are named/used — 91 are placeholder slots | **LOW** | Expected — reserved for future |
| No data validation before import (accepts what CSV gives) | **MEDIUM** | Add schema validation |
| No reconciliation between evolved_eden_agents ↔ agent_registry ↔ agent_definitions | **MEDIUM** | Run align-agent-tables.mjs |
| CSV is manually generated — no source-of-truth pipeline | **MEDIUM** | Create canonical data source |

---

## 🚨 Launch Blockers (Must Fix Before Production)

| # | Blocker | Area | Action Required |
|---|---|---|---|
| 1 | **82 files with hardcoded Supabase ref** | Security | Remove all `'db.jebixydqpvsegvrtfmgm.supabase.co'` fallbacks; scripts must use env vars only |
| 2 | **Docker blank passwords** | Security | Set `POSTGRES_PASSWORD`, `PGADMIN_DEFAULT_PASSWORD` via env vars, never blank |
| 3 | **Hardcoded N8N_ENCRYPTION_KEY** | Security | Move to env var `${N8N_ENCRYPTION_KEY}` |
| 4 | **Migrations 00005–00010 not run** | Database | Run sequentially in Supabase SQL Editor |
| 5 | **No tests** | Code Quality | Add at least integration tests for critical API routes |
| 6 | **No error pages** | Code Quality | Add root `error.tsx`, `not-found.tsx`, `loading.tsx` |
| 7 | **n8n unreachable** | Infrastructure | Fix DNS `automation.evolvededen.com` or update N8N_URL |
| 8 | **No monitoring** | Infrastructure | Add Sentry or OpenTelemetry before prod |

## ⚠️ High Priority (Fix Before First Customers)

| # | Issue | Action |
|---|---|---|
| 9 | 143 legacy scripts in `/scripts` | Archive old scripts; keep only active 5-10 |
| 10 | No RLS on evolved_eden_agents | Add row-level security |
| 11 | No transaction safety in import | Add BEGIN/COMMIT/ROLLBACK |
| 12 | Data reconcile never run | `node scripts/align-agent-tables.mjs` |
| 13 | Archetype ID 5 duplicate | Resolve Caregiver vs Altruist overlap |

## ✅ What's Actually Good

- Middleware auth + role checks working (admin, client, dashboard routes)
- Centralized config system is well-designed
- Archetype migration (00010) is comprehensive and well-documented
- Import script is robust against CSV data quality issues
- Dockerfile is optimized (multi-stage, standalone, non-root)
- Proper cursor-based connection pooling
- Dark-themed UI consistent across admin dashboard
- AI provider integration (OpenAI, Anthropic, Google, DeepSeek, Ollama)

---

*Generated by Evolved Eden Intelligence Platform — Full Production Diagnostics 2026-06-07*
