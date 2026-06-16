import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { platform, config_data } = body

    if (!platform) {
      return NextResponse.json({ error: 'platform is required' }, { status: 400 })
    }

    const results: Record<string, any> = {}

    if (platform === 'n8n') {
      const n8nUrl = config_data?.url || process.env.N8N_PUBLIC_API_URL
      const token = config_data?.api_key || process.env.N8N_PUBLIC_API_KEY

      if (n8nUrl && token) {
        try {
          const res = await fetch(`${n8nUrl}/rest/me`, {
            headers: { 'X-N8N-API-KEY': token },
          })
          results.connected = res.ok
          results.detail = res.ok ? 'Connected' : `HTTP ${res.status}`
        } catch (e: any) {
          results.connected = false
          results.detail = e.message
        }
      } else {
        results.connected = false
        results.detail = 'Missing URL or API key'
      }
    }

    if (platform === 'discord') {
      const token = config_data?.bot_token
      if (token) {
        try {
          const res = await fetch('https://discord.com/api/v10/users/@me', {
            headers: { Authorization: `Bot ${token}` },
          })
          const data = await res.json()
          results.connected = res.ok
          results.detail = res.ok ? `Bot: ${data.username}` : `HTTP ${res.status}`
        } catch (e: any) {
          results.connected = false
          results.detail = e.message
        }
      } else {
        results.connected = false
        results.detail = 'Missing bot token'
      }
    }

    if (platform === 'whatsapp') {
      const phoneNumberId = config_data?.phone_number_id
      const token = config_data?.access_token
      if (phoneNumberId && token) {
        try {
          const res = await fetch(
            `https://graph.facebook.com/v18.0/${phoneNumberId}/messages?limit=1`,
            { headers: { Authorization: `Bearer ${token}` } }
          )
          results.connected = res.ok
          results.detail = res.ok ? 'Connected' : `HTTP ${res.status}`
        } catch (e: any) {
          results.connected = false
          results.detail = e.message
        }
      } else {
        results.connected = false
        results.detail = 'Missing phone number ID or access token'
      }
    }

    results.checked_at = new Date().toISOString()

    return NextResponse.json(results)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
