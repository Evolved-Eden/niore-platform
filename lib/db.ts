import { Pool, QueryResultRow } from 'pg'

// All connection details MUST come from env vars — no fallback defaults.
// The shared Supabase project ref is never hardcoded; each deployment sets its own.
// Pool is lazily initialized to avoid crashing during builds without DB access.

let pool: Pool | null = null

function getPool(): Pool {
  if (!pool) {
    // Support LOCAL_DATABASE_URL as a full connection string, but only for
    // actual local development. `VERCEL` is set on every Vercel deployment
    // (production, preview, and `vercel dev`), so this guard stops a
    // leftover/misconfigured LOCAL_DATABASE_URL env var from silently
    // routing production traffic at a local Postgres instance that can
    // never be reachable from a serverless function (this was causing
    // real "connect ECONNREFUSED 127.0.0.1:5432" failures in prod on
    // /api/client/essence/execute and /api/agents).
    const localUrl = !process.env.VERCEL ? process.env.LOCAL_DATABASE_URL : undefined
    if (localUrl) {
      const u = new URL(localUrl)
      pool = new Pool({
        host: u.hostname,
        port: parseInt(u.port || '5432'),
        user: u.username,
        password: decodeURIComponent(u.password),
        database: u.pathname.slice(1),
        ssl: false, // local connections typically don't need SSL
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
      })
      return pool
    }

    const DB_HOST = process.env.DB_HOST || process.env.POSTGRES_HOST
    if (!DB_HOST) throw new Error('DB_HOST environment variable is required (auto-checks POSTGRES_HOST fallback)')
    if (process.env.VERCEL && (DB_HOST === 'localhost' || DB_HOST === '127.0.0.1')) {
      throw new Error(
        `DB_HOST is set to "${DB_HOST}" in a Vercel deployment — this can never connect. ` +
        'Check the DB_HOST/POSTGRES_HOST environment variable for this project/environment in Vercel.'
      )
    }

    const DB_PORT = process.env.DB_PORT || process.env.POSTGRES_PORT || '5432'
    const DB_USER = process.env.DB_USER || process.env.POSTGRES_USER || 'postgres'
    const DB_PASSWORD = process.env.SUPABASE_DB_PASSWORD || process.env.DB_PASSWORD || process.env.POSTGRES_PASSWORD
    if (!DB_PASSWORD) throw new Error('SUPABASE_DB_PASSWORD, DB_PASSWORD, or POSTGRES_PASSWORD environment variable is required')

    const DB_NAME = process.env.DB_NAME || process.env.POSTGRES_DATABASE || 'postgres'
    const DB_SSL = process.env.DB_SSL || process.env.POSTGRES_SSL || 'true'

    pool = new Pool({
      host: DB_HOST,
      port: parseInt(DB_PORT, 10),
      user: DB_USER,
      password: DB_PASSWORD,
      database: DB_NAME,
      ssl: DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    })
  }
  return pool
}

export async function query<T extends QueryResultRow = any>(text: string, params?: any[]) {
  const p = getPool()
  const client = await p.connect()
  try {
    return await client.query<T>(text, params)
  } finally {
    client.release()
  }
}

export async function queryOne<T extends QueryResultRow = any>(text: string, params?: any[]) {
  const p = getPool()
  const client = await p.connect()
  try {
    const res = await client.query<T>(text, params)
    return res.rows[0] ?? null
  } finally {
    client.release()
  }
}

export default getPool
