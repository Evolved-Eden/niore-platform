/**
 * Centralized configuration system.
 * Reads from `app_config` DB table with env var fallback.
 *
 * Priority: env var > DB config > default value
 *
 * Admin panel at /dashboard/admin/settings manages DB entries.
 * Env vars always take precedence for secrets in production.
 */

export interface AppConfigEntry {
  key: string
  value: string
  value_type: 'string' | 'number' | 'boolean' | 'json'
  category: string
  description: string | null
  updated_at: string
}

// ── Cache ────────────────────────────────────────────────────────────
let configCache: Record<string, AppConfigEntry> | null = null
let cacheTime = 0
const CACHE_TTL = 5 * 60 * 1000

async function refreshCache(): Promise<void> {
  const now = Date.now()
  if (configCache && now - cacheTime <= CACHE_TTL) return
  try {
    const { query } = await import('@/lib/db')
    const { rows } = await query(
      'SELECT key, value, value_type, category, description, updated_at FROM app_config'
    )
    configCache = {}
    for (const row of rows) {
      configCache[row.key] = row
    }
    cacheTime = now
  } catch {
    configCache = {}
    cacheTime = Date.now()
  }
}

function invalidateCache(): void {
  configCache = null
  cacheTime = 0
}

// ── Core API ─────────────────────────────────────────────────────────

/** Get a config value (env var > DB > default) */
export async function getConfig(key: string, defaultValue?: string): Promise<string> {
  // Env vars always take precedence (for secrets in production)
  if (process.env[key] !== undefined) {
    return process.env[key]!
  }
  await refreshCache()
  const entry = configCache?.[key]
  if (entry) {
    return entry.value
  }
  return defaultValue ?? ''
}

/** Set a config value in the DB */
export async function setConfig(
  key: string,
  value: string,
  options?: { value_type?: string; category?: string; description?: string }
): Promise<void> {
  const { query } = await import('@/lib/db')
  await query(
    `INSERT INTO app_config (key, value, value_type, category, description)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (key) DO UPDATE SET
       value = EXCLUDED.value,
       value_type = COALESCE(EXCLUDED.value_type, app_config.value_type),
       category = COALESCE(EXCLUDED.category, app_config.category),
       description = COALESCE(EXCLUDED.description, app_config.description),
       updated_at = now()`,
    [
      key,
      value,
      options?.value_type || 'string',
      options?.category || 'general',
      options?.description || null,
    ]
  )
  invalidateCache()
}

/** Get all config entries */
export async function getAllConfig(): Promise<AppConfigEntry[]> {
  try {
    const { query } = await import('@/lib/db')
    const { rows } = await query(
      'SELECT key, value, value_type, category, description, updated_at FROM app_config ORDER BY category, key'
    )
    return rows
  } catch {
    return []
  }
}

/** Delete a config entry */
export async function deleteConfig(key: string): Promise<void> {
  const { query } = await import('@/lib/db')
  await query('DELETE FROM app_config WHERE key = $1', [key])
  invalidateCache()
}

// ── Convenience getters ──────────────────────────────────────────────

export async function getOpenAIKey(): Promise<string> {
  return getConfig('OPENAI_API_KEY')
}

export async function getAnthropicKey(): Promise<string> {
  return getConfig('ANTHROPIC_API_KEY')
}

export async function getEssenceProvider(): Promise<string> {
  return getConfig('ESSENCE_AI_PROVIDER')
}

export async function getEssenceModel(): Promise<string> {
  return getConfig('ESSENCE_AI_MODEL', 'gpt-4o-mini')
}

export async function getOpenRouterKey(): Promise<string> {
  return process.env.OPENROUTER_API_KEY || ''
}

export async function getStripeKey(): Promise<string> {
  return process.env.STRIPE_SECRET_KEY || ''
}

export async function getN8nMcpToken(): Promise<string> {
  return getConfig('N8N_MCP_TOKEN')
}

export async function getN8nApiKey(): Promise<string> {
  return getConfig('N8N_PUBLIC_API_KEY')
}
