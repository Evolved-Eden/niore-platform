import { supabaseAdmin } from '@/lib/supabase/admin'
import AvatarsManager from './AvatarsManager'

export const dynamic = 'force-dynamic'

export default async function AdminAvatarsPage() {
  try {
    const { data } = await supabaseAdmin
      .from('avatars')
      .select('*')
      .order('sort_order', { ascending: true })

    return <AvatarsManager initialAvatars={data || []} />
  } catch {
    return <AvatarsManager initialAvatars={[]} />
  }
}
