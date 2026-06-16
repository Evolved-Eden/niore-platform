import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

describe('lib/db', () => {
  const savedEnv = { ...process.env }

  beforeEach(() => {
    process.env = { ...savedEnv }
    vi.resetModules()
  })

  afterEach(() => {
    process.env = savedEnv
  })

  it('throws if DB_HOST is missing', async () => {
    delete process.env.DB_HOST
    delete process.env.SUPABASE_DB_PASSWORD
    delete process.env.DB_PASSWORD
    const { query } = await import('@/lib/db')
    await expect(query('SELECT 1')).rejects.toThrow(/DB_HOST/)
  })

  it('throws if password is missing', async () => {
    process.env.DB_HOST = 'localhost'
    delete process.env.SUPABASE_DB_PASSWORD
    delete process.env.DB_PASSWORD
    const { query } = await import('@/lib/db')
    await expect(query('SELECT 1')).rejects.toThrow(/PASSWORD/)
  })
})
