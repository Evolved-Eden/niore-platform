import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { calculateFullProfile } from '@/lib/profile'

export const dynamic = 'force-dynamic'

/**
 * POST /api/profile/calculate
 * Runs ALL lens calculations for the current user
 * and stores results in client_twins.metadata.lenses
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch current twin data
    const { data: twin } = await supabaseAdmin
      .from('client_twins')
      .select('id, metadata')
      .eq('client_id', user.id)
      .maybeSingle()

    if (!twin) {
      return NextResponse.json({ error: 'Profile not found. Complete intake first.' }, { status: 404 })
    }

    const metadata = (twin.metadata as any) || {}
    const intake = metadata.intake || {}
    const sections = intake.sections || intake

    // Parse intake data
    const personal = sections.personal || sections
    const firstName = sections.firstName || personal.name?.split(' ')[0] || user.email?.split('@')[0] || ''
    const lastName = sections.lastName || personal.name?.split(' ').slice(-1)[0] || ''
    const middleName = sections.middleName || personal.middleName
    const birthDate = sections.dob || personal.dob || personal.birthDate || ''
    const birthTime = sections.birthTime || personal.birthTime || ''
    const birthTimezone = sections.birthTimezone || sections.timezone || personal.birthTimezone || personal.timezone
    const latitude = sections.latitude || personal.latitude
    const longitude = sections.longitude || personal.longitude

    if (!birthDate) {
      return NextResponse.json({ error: 'Birth date not found in intake' }, { status: 400 })
    }

    // Run ALL lens calculations
    const result = await calculateFullProfile({
      firstName,
      middleName,
      lastName,
      birthDate,
      birthTime,
      timezone: birthTimezone,
      latitude,
      longitude,
      role: sections.role,
      personal: sections.personal,
    })

    // Build lenses block from all calculated systems
    const lensSystems = [
      { key: 'astrology', data: result.core.astrology },
      { key: 'vedicAstrology', data: result.core.vedicAstrology },
      { key: 'numerology', data: result.core.numerology },
      { key: 'chineseZodiac', data: result.core.chineseZodiac },
      { key: 'biorhythms', data: result.core.biorhythms },
      { key: 'elementalArchetype', data: result.core.elementalArchetype },
      { key: 'lifeTheme', data: result.core.lifeTheme },
      { key: 'soulProfile', data: result.core.soulProfile },
    ]

    const lenses: Record<string, any> = {
      ...(metadata.lenses || {}),
    }

    for (const ls of lensSystems) {
      if (ls.data) {
        lenses[ls.key] = {
          status: 'calculated' as const,
          data: ls.data,
          calculatedAt: result.calculatedAt,
        }
      } else {
        // Don't overwrite existing data with 'failed'
        if (!lenses[ls.key]) {
          lenses[ls.key] = { status: 'failed' as const }
        }
      }
    }

    // Save to database
    const { error: updateError } = await supabaseAdmin
      .from('client_twins')
      .update({ metadata: { ...metadata, lenses } })
      .eq('id', twin.id)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // Return summary of calculated systems
    const calculated = Object.entries(lenses)
      .filter(([, v]: [string, any]) => v?.status === 'calculated')
      .map(([k]) => k)

    return NextResponse.json({
      success: true,
      calculated,
      total: lensSystems.length,
    })
  } catch (err: any) {
    console.error('Profile calculate error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
