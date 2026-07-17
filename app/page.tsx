import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import EvolvedEdenLanding from './landing'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    const { data: identity } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    const role = identity?.role ?? 'client'
    redirect(`/dashboard/${role}`)
  }

  return <EvolvedEdenLanding />
}
