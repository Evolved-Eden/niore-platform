import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/admin-auth'

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth
    const body = await request.json()
    const { platform } = body
    let { config_data } = body

    if (!platform) {
      return NextResponse.json({ error: 'platform is required' }, { status: 400 })
    }

    // Fall back to the saved config if the caller didn't send form data
    // (e.g. testing a connector that was configured previously and hasn't
    // been re-entered in the form this session).
    if (!config_data || Object.keys(config_data).length === 0) {
      const { data: saved } = await supabaseAdmin
        .from('connector_configs')
        .select('config_data')
        .eq('platform', platform)
        .maybeSingle()
      config_data = saved?.config_data ?? {}
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

    if (platform === 'google_calendar') {
      const serviceAccountRaw = config_data?.service_account_json
      const calendarId = config_data?.calendar_id || 'primary'
      if (serviceAccountRaw) {
        try {
          const serviceAccountJson = typeof serviceAccountRaw === 'string' ? JSON.parse(serviceAccountRaw) : serviceAccountRaw
          const { google } = await import('googleapis')
          const auth2 = new google.auth.JWT({
            email: serviceAccountJson.client_email,
            key: serviceAccountJson.private_key,
            scopes: ['https://www.googleapis.com/auth/calendar.readonly'],
          })
          const calendar = google.calendar({ version: 'v3', auth: auth2 })
          const res = await calendar.calendars.get({ calendarId })
          results.connected = true
          results.detail = `Connected: ${res.data.summary ?? calendarId}`
        } catch (e: any) {
          results.connected = false
          results.detail = e.message?.includes('JSON') ? 'Invalid service account JSON' : e.message
        }
      } else {
        results.connected = false
        results.detail = 'Missing service account JSON'
      }
    }

    if (platform === 'email') {
      const { smtp_host, smtp_port, smtp_username, smtp_password } = config_data ?? {}
      if (smtp_host && smtp_port && smtp_username && smtp_password) {
        // No SMTP client library is installed in this codebase yet
        // (nodemailer or similar) -- this confirms the fields are present
        // rather than performing a live connection test. Add nodemailer as
        // a dependency to upgrade this to a real handshake test.
        results.connected = true
        results.detail = `Configuration complete (${smtp_host}:${smtp_port}) -- fields present, not a live connection test`
      } else {
        results.connected = false
        results.detail = 'Missing SMTP host, port, username, or password'
      }
    }

    results.checked_at = new Date().toISOString()

    return NextResponse.json(results)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
