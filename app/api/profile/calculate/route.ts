import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { calculateFullProfile, calculateNumerology, calculateAstrology } from '@/lib/profile'

export const dynamic = 'force-dynamic'

/**
 * POST /api/profile/calculate
 * Runs all lens calculations (astrology, numerology) for the current user
 * and stores results in client_twins.metadata
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch current intake/twin data
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

    // Parse intake data for calculations
    const firstName = intake.personal?.firstName || intake.name?.split(' ')[0] || ''
    const lastName = intake.personal?.lastName || intake.name?.split(' ').slice(-1)[0] || ''
    const birthDate = intake.personal?.dob || intake.dob || ''
    const birthTime = intake.personal?.birthTime || intake.birthTime || ''
    const latitude = intake.personal?.latitude || intake.latitude
    const longitude = intake.personal?.longitude || intake.longitude

    if (!birthDate) {
      return NextResponse.json({ error: 'Birth date not found in intake data' }, { status: 400 })
    }

    // Run calculations
    const result = await calculateFullProfile({
      firstName,
      middleName: intake.personal?.middleName,
      lastName,
      birthDate,
      birthTime,
      latitude,
      longitude,
      role: intake.role,
      personal: intake.personal,
    })

    // Merge lens data into metadata
    const updatedMetadata = {
      ...metadata,
      lenses: {
        ...(metadata.lenses || {}),
        astrology: result.core.astrology ? {
          status: 'calculated',
          data: result.core.astrology,
          calculatedAt: result.calculatedAt,
        } : { status: 'failed' },
        numerology: result.core.numerology ? {
          status: 'calculated',
          data: result.core.numerology,
          calculatedAt: result.calculatedAt,
        } : { status: 'failed' },
        humanDesign: metadata.lenses?.humanDesign || metadata.blueprint ? {
          status: 'calculated',
          data: metadata.blueprint || {},
          calculatedAt: metadata.calculatedAt || result.calculatedAt,
        } : { status: 'pending' },
      },
    }

    // Save to database
    const { error: updateError } = await supabaseAdmin
      .from('client_twins')
      .update({ metadata: updatedMetadata })
      .eq('id', twin.id)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      lenses: {
        astrology: result.core.astrology ? 'calculated' : 'failed',
        numerology: result.core.numerology ? 'calculated' : 'failed',
      },
    })
  } catch (err: any) {
    console.error('Profile calculate error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
