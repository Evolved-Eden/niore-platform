import { Pool, QueryResultRow } from 'pg'

// All connection details MUST come from env vars — no fallback defaults.
// The shared Supabase project ref is never hardcoded; each deployment sets its own.
// Pool is lazily initialized to avoid crashing during builds without DB access.

let pool: Pool | null = null

function getPool(): Pool {
  if (!pool) {
    const DB_HOST = process.env.DB_HOST
    if (!DB_HOST) throw new Error('DB_HOST environment variable is required')

    const DB_PORT = process.env.DB_PORT || '5432'
    const DB_USER = process.env.DB_USER || 'postgres'
    const DB_PASSWORD = process.env.SUPABASE_DB_PASSWORD || process.env.DB_PASSWORD
    if (!DB_PASSWORD) throw new Error('SUPABASE_DB_PASSWORD or DB_PASSWORD environment variable is required')

    const DB_NAME = process.env.DB_NAME || 'postgres'
    const DB_SSL = process.env.DB_SSL || 'true'

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
