import { createClient } from '@/lib/supabase/server'
import { RaporlarClient } from '@/components/dashboard/RaporlarClient'
import type { VisitWithProfile } from '@/types'

export default async function AdminRaporlarPage() {
  const supabase = await createClient()

  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString().slice(0, 10)

  const [{ data: visits }, { data: staff }] = await Promise.all([
    supabase
      .from('visits')
      .select('visit_date, user_id, company_name_snapshot, profiles(id, name)')
      .gte('visit_date', monthStart)
      .order('visit_date', { ascending: false })
      .limit(500),
    supabase
      .from('profiles')
      .select('id, name')
      .eq('role', 'personel')
      .eq('active', true)
      .order('name'),
  ])

  return (
    <RaporlarClient
      visits={(visits ?? []) as unknown as VisitWithProfile[]}
      staff={staff ?? []}
    />
  )
}
