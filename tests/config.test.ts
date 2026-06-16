import { describe, it, expect, beforeEach, afterEach } from 'vitest'

describe('lib/config', () => {
  const savedEnv = { ...process.env }

  beforeEach(() => {
    process.env = { ...savedEnv }
  })

  afterEach(() => {
    process.env = savedEnv
  })

  it('returns env var when set (env > DB > default)', async () => {
    process.env.TEST_CONFIG_KEY = 'from-env'
    const { getConfig } = await import('@/lib/config')
    const value = await getConfig('TEST_CONFIG_KEY', 'default-value')
    expect(value).toBe('from-env')
  })

  it('returns default when env and DB are unset', async () => {
    delete process.env.UNSET_CONFIG_KEY
    const { getConfig } = await import('@/lib/config')
    const value = await getConfig('UNSET_CONFIG_KEY', 'fallback-default')
    expect(value).toBe('fallback-default')
  })

  it('returns empty string when no default provided and unset', async () => {
    delete process.env.MISSING_KEY
    const { getConfig } = await import('@/lib/config')
    const value = await getConfig('MISSING_KEY')
    expect(value).toBe('')
  })

  it('OpenRouter key reads directly from env', async () => {
    process.env.OPENROUTER_API_KEY = 'sk-or-test'
    const { getOpenRouterKey } = await import('@/lib/config')
    expect(await getOpenRouterKey()).toBe('sk-or-test')
  })

  it('Stripe key reads directly from env', async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_123'
    const { getStripeKey } = await import('@/lib/config')
    expect(await getStripeKey()).toBe('sk_test_123')
  })
})
