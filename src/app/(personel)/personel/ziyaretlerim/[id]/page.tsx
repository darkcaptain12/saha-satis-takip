import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { LocationStatusBadge } from '@/components/visits/LocationStatusBadge'
import { VisitMap } from '@/components/map/VisitMap'
import { formatDate, formatTime } from '@/lib/utils'
import { Building2, Clock, MapPin, FileText } from 'lucide-react'
import Link from 'next/link'
import type { Visit } from '@/types'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function PersonelZiyaretDetayPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: visit } = await supabase
    .from('visits')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)     // RLS + URL doğrulama: sadece kendi kaydı
    .single()

  if (!visit) notFound()

  const v = visit as Visit
  const hasLocation = v.location_status === 'success' && v.latitude != null && v.longitude != null

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/personel/ziyaretlerim" className="hover:text-brand">← Ziyaretlerim</Link>
      </div>

      <Card>
        <div className="flex items-start justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-900">{v.company_name_snapshot}</h2>
          <LocationStatusBadge status={v.location_status} />
        </div>

        <dl className="space-y-4">
          <InfoRow icon={<Building2 className="h-4 w-4 text-gray-400" />} label="Firma" value={v.company_name_snapshot} />
          <InfoRow
            icon={<Clock className="h-4 w-4 text-gray-400" />}
            label="Tarih / Saat"
            value={`${formatDate(v.visit_date)} · ${formatTime(v.visit_time)}`}
          />
          {hasLocation && (
            <InfoRow
              icon={<MapPin className="h-4 w-4 text-gray-400" />}
              label="Koordinat"
              value={`${v.latitude?.toFixed(6)}, ${v.longitude?.toFixed(6)} (±${v.accuracy?.toFixed(0)}m)`}
            />
          )}
          {v.note && (
            <InfoRow
              icon={<FileText className="h-4 w-4 text-gray-400" />}
              label="Not"
              value={v.note}
              multiline
            />
          )}
        </dl>
      </Card>

      {hasLocation && (
        <Card padding={false} className="overflow-hidden">
          <VisitMap visits={[v]} height="250px" singleVisit />
        </Card>
      )}
    </div>
  )
}

function InfoRow({
  icon, label, value, multiline
}: {
  icon: React.ReactNode; label: string; value: string; multiline?: boolean
}) {
  return (
    <div className="flex gap-3">
      <div className="mt-0.5">{icon}</div>
      <div>
        <dt className="text-xs text-gray-400 mb-0.5">{label}</dt>
        <dd className={`text-sm text-gray-900 ${multiline ? 'whitespace-pre-wrap' : ''}`}>{value}</dd>
      </div>
    </div>
  )
}
