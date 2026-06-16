import { supabaseAdmin } from '@/lib/supabase/admin'
import VerticalsManager from './VerticalsManager'

export const dynamic = 'force-dynamic'

export default async function AdminVerticalsPage() {
  try {
    const { data } = await supabaseAdmin
      .from('verticals')
      .select('*')
      .order('name', { ascending: true })

    return <VerticalsManager initialVerticals={data || []} />
  } catch {
    return <VerticalsManager initialVerticals={[]} />
  }
}
