import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { LocationStatusBadge } from '@/components/visits/LocationStatusBadge'
import { formatDate, formatTime } from '@/lib/utils'
import { EmptyState } from '@/components/ui/EmptyState'
import Link from 'next/link'
import { ClipboardList } from 'lucide-react'
import type { Visit } from '@/types'

export default async function ZiyaretlerimPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: visits } = await supabase
    .from('visits')
    .select('*')
    .eq('user_id', user.id)
    .order('visit_date', { ascending: false })
    .order('visit_time', { ascending: false })

  // Tarihe göre grupla
  const grouped: Record<string, Visit[]> = {}
  ;(visits as Visit[] ?? []).forEach((v) => {
    if (!grouped[v.visit_date]) grouped[v.visit_date] = []
    grouped[v.visit_date].push(v)
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Ziyaretlerim</h1>
        <span className="text-sm text-gray-500">{visits?.length ?? 0} kayıt</span>
      </div>

      {Object.keys(grouped).length === 0 && (
        <EmptyState
          icon={<ClipboardList className="h-8 w-8" />}
          title="Henüz ziyaret kaydı yok"
          description="Yeni ziyaret oluşturmak için + butonunu kullanın."
          action={
            <Link
              href="/personel/yeni-ziyaret"
              className="mt-2 inline-flex items-center gap-2 bg-brand text-white px-5 py-2.5 rounded-lg text-sm font-medium"
            >
              Yeni Ziyaret Oluştur
            </Link>
          }
        />
      )}

      {Object.entries(grouped).map(([date, dayVisits]) => (
        <div key={date}>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 px-1">
            {formatDate(date)}
          </p>
          <Card padding={false}>
            <div className="divide-y divide-gray-50">
              {dayVisits.map((v) => (
                <Link
                  key={v.id}
                  href={`/personel/ziyaretlerim/${v.id}`}
                  className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 active:bg-gray-100"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900 truncate">{v.company_name_snapshot}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{formatTime(v.visit_time)}</p>
                    {v.note && (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-1">{v.note}</p>
                    )}
                  </div>
                  <div className="ml-3 shrink-0">
                    <LocationStatusBadge status={v.location_status} />
                  </div>
                </Link>
              ))}
            </div>
          </Card>
        </div>
      ))}
    </div>
  )
}
