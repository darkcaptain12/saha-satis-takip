import { createClient } from '@/lib/supabase/server'
import { VisitMap } from '@/components/map/VisitMap'
import type { Visit } from '@/types'

export default async function AdminHaritaPage() {
  const supabase = await createClient()

  const { data: visits } = await supabase
    .from('visits')
    .select('*')
    .eq('location_status', 'success')
    .not('latitude', 'is', null)
    .order('created_at', { ascending: false })
    .limit(500)

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">
        {visits?.length ?? 0} konumlu ziyaret gösteriliyor.
      </p>
      <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm">
        <VisitMap
          visits={(visits ?? []) as Visit[]}
          height="calc(100vh - 180px)"
        />
      </div>
    </div>
  )
}
