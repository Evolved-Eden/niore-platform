import { supabaseAdmin } from '@/lib/supabase/admin'
import SpecialtiesManager from './SpecialtiesManager'

export const dynamic = 'force-dynamic'

export default async function AdminSpecialtiesPage() {
  try {
    const { data, error } = await supabaseAdmin
      .from('specialties')
      .select('*')
      .order('name', { ascending: true })
    if (error) throw error
    return <SpecialtiesManager initialSpecialties={data || []} />
  } catch {
    return <SpecialtiesManager initialSpecialties={[]} />
  }
}
