import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { getAllConfig, setConfig, deleteConfig } from '@/lib/config'
import { requireAdmin } from '@/lib/admin-auth'

/**
 * GET /api/admin/settings
 * Returns all config entries with metadata about env var overrides.
 */
export async function GET() {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth
    const dbConfigs = await getAllConfig()

    // Annotate with env var source info for the admin panel
    const configs = dbConfigs.map((c) => ({
      ...c,
      source: process.env[c.key] !== undefined ? ('env' as const) : ('db' as const),
      env_value: process.env[c.key] !== undefined ? process.env[c.key] : null,
    }))

    // Also report env-only values not in DB
    const dbKeys = new Set(dbConfigs.map((c) => c.key))
    const envOnly: { key: string; value: string | undefined }[] = []
    const trackedKeys = new Set([
      'OPENAI_API_KEY', 'ANTHROPIC_API_KEY', 'STRIPE_SECRET_KEY',
      'STRIPE_WEBHOOK_SECRET', 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
      'SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_DB_PASSWORD',
      'N8N_MCP_TOKEN', 'N8N_PUBLIC_API_KEY', 'ESSENCE_AI_PROVIDER',
      'ESSENCE_AI_MODEL',
    ])
    for (const key of trackedKeys) {
      if (!dbKeys.has(key) && process.env[key]) {
        envOnly.push({ key, value: process.env[key] })
      }
    }

    return NextResponse.json({ configs, envOnly })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

/**
 * POST /api/admin/settings
 * Create or update a config entry.
 * Body: { key, value, value_type?, category?, description? }
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth

    const { key, value, value_type, category, description } = await req.json()

    if (!key) {
      return NextResponse.json({ error: 'key is required' }, { status: 400 })
    }

    await setConfig(key, String(value ?? ''), { value_type, category, description })

    return NextResponse.json({ success: true, key })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

/**
 * DELETE /api/admin/settings
 * Delete a config entry.
 * Body: { key }
 */
export async function DELETE(req: NextRequest) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth

    const { key } = await req.json()
    if (!key) return NextResponse.json({ error: 'key is required' }, { status: 400 })

    await deleteConfig(key)
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
