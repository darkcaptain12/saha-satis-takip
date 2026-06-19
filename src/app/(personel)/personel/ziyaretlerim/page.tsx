import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ZiyaretlerimClient } from '@/components/visits/ZiyaretlerimClient'
import type { Visit } from '@/types'

interface PageProps {
  searchParams: Promise<{
    q?: string
    from?: string
    to?: string
    status?: string
  }>
}

export default async function ZiyaretlerimPage({ searchParams }: PageProps) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  let query = supabase
    .from('visits')
    .select('id, company_name_snapshot, visit_date, visit_time, location_status, status, note')
    .eq('user_id', user.id)
    .order('visit_date', { ascending: false })
    .order('visit_time', { ascending: false })

  if (params.from)   query = query.gte('visit_date', params.from)
  if (params.to)     query = query.lte('visit_date', params.to)
  if (params.status) query = query.eq('status', params.status)
  if (params.q)      query = query.ilike('company_name_snapshot', `%${params.q}%`)

  const { data: visits } = await query

  return (
    <ZiyaretlerimClient
      visits={(visits as Visit[]) ?? []}
      current={params}
    />
  )
}
