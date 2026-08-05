import { supabaseAdmin } from '@/lib/supabase/admin'
import { decryptCredentials, type EncryptedPayload } from '@/lib/connector-encryption'

/**
 * Real Google Calendar integration, backed by the admin-configured
 * connector (see /dashboard/admin/connectors -> Google Calendar card,
 * stored as a `google_calendar` connector_type credential in
 * `connector_credentials`, client_id NULL = platform-global).
 *
 * Reads a service account JSON + target calendar_id from that credential
 * (encrypted at rest), not env vars — so an admin can add/change/rotate
 * credentials from the dashboard without a code deploy.
 *
 * If no connector is configured (or it's inactive), returns null so
 * callers can fall back to a placeholder rather than throwing.
 */

interface GoogleCalendarConfig {
  serviceAccountJson: Record<string, unknown>
  calendarId: string
}

async function getGoogleCalendarConfig(): Promise<GoogleCalendarConfig | null> {
  const { data: typeRow } = await supabaseAdmin
    .from('connector_types')
    .select('id')
    .eq('key', 'google_calendar')
    .maybeSingle()

  if (!typeRow) return null

  const { data, error } = await supabaseAdmin
    .from('connector_credentials')
    .select('encrypted_credentials')
    .is('client_id', null)
    .eq('connector_id', typeRow.id)
    .maybeSingle()

  if (error || !data) return null

  let raw: Record<string, unknown>
  try {
    raw = decryptCredentials(data.encrypted_credentials as EncryptedPayload) ?? {}
  } catch {
    return null
  }

  const serviceAccountRaw = raw?.service_account_json
  const calendarId = (raw?.calendar_id as string) || 'primary'

  if (!serviceAccountRaw) return null

  let serviceAccountJson: Record<string, unknown>
  try {
    serviceAccountJson = typeof serviceAccountRaw === 'string' ? JSON.parse(serviceAccountRaw) : (serviceAccountRaw as Record<string, unknown>)
  } catch {
    return null
  }

  return { serviceAccountJson, calendarId }
}

export interface CreateCalendarEventParams {
  summary: string
  description?: string
  startTime: string // ISO 8601
  durationMinutes: number
  attendeeEmail?: string
}

export interface CreateCalendarEventResult {
  eventId: string
  htmlLink: string
  meetLink: string | null
}

/**
 * Create a real Google Calendar event. Returns null if Google Calendar
 * isn't configured (not an error -- callers should fall back gracefully).
 * Throws if it's configured but the API call itself fails, so a bad
 * credential surfaces instead of silently no-oping.
 */
export async function createCalendarEvent(params: CreateCalendarEventParams): Promise<CreateCalendarEventResult | null> {
  const config = await getGoogleCalendarConfig()
  if (!config) return null

  // Lazy import -- googleapis is a real dependency now (package.json), but
  // keeping the import inside the function means this file doesn't blow up
  // in environments where it hasn't been installed/deployed yet.
  const { google } = await import('googleapis')

  const auth = new google.auth.JWT({
    email: config.serviceAccountJson.client_email as string,
    key: config.serviceAccountJson.private_key as string,
    scopes: ['https://www.googleapis.com/auth/calendar'],
  })

  const calendar = google.calendar({ version: 'v3', auth })

  const startTime = new Date(params.startTime)
  const endTime = new Date(startTime.getTime() + params.durationMinutes * 60 * 1000)

  const response = await calendar.events.insert({
    calendarId: config.calendarId,
    conferenceDataVersion: 1,
    requestBody: {
      summary: params.summary,
      description: params.description,
      start: { dateTime: startTime.toISOString() },
      end: { dateTime: endTime.toISOString() },
      attendees: params.attendeeEmail ? [{ email: params.attendeeEmail }] : undefined,
      conferenceData: {
        createRequest: {
          requestId: crypto.randomUUID(),
          conferenceSolutionKey: { type: 'hangoutsMeet' },
        },
      },
    },
  })

  const meetLink = response.data.conferenceData?.entryPoints?.find(
    (e) => e.entryPointType === 'video'
  )?.uri ?? null

  return {
    eventId: response.data.id!,
    htmlLink: response.data.htmlLink!,
    meetLink,
  }
}
