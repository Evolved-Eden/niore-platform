import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import EvolvedEdenLanding from './landing'

export default async function HomePage() {
  let user = null

  try {
    const supabase = await createClient()
    const { data } = await supabase.auth.getUser()
    user = data?.user ?? null
  } catch {
    // env vars not configured yet — show landing page
  }

  if (user) {
    try {
      const supabase = await createClient()
      const { data: identity } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

      const role = identity?.role ?? 'client'
      redirect(`/dashboard/${role}`)
    } catch {
      redirect('/dashboard')
    }
  }

  return <EvolvedEdenLanding />
}
