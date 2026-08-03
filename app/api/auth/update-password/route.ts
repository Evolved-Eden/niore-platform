import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { updatePassword } from '@/lib/auth-direct'

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json()
    if (!password || password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    await updatePassword(user.id, password)
    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Update password error:', err)
    return NextResponse.json({ error: err.message || 'Failed to update password' }, { status: 500 })
  }
}
