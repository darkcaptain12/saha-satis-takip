import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { LocationStatusBadge } from '@/components/visits/LocationStatusBadge'
import { DeleteVisitButton } from '@/components/visits/DeleteVisitButton'
import { formatDate, formatTime } from '@/lib/utils'
import { VisitMap } from '@/components/map/VisitMap'
import { Building2, User, Clock, MapPin, FileText, Navigation2 } from 'lucide-react'
import Link from 'next/link'
import type { Visit, Profile } from '@/types'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function AdminZiyaretDetayPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: visit } = await supabase
    .from('visits')
    .select('*, profiles(id, name, email), companies(id, name)')
    .eq('id', id)
    .single()

  if (!visit) notFound()

  const v = visit as Visit & {
    profiles: Pick<Profile, 'id' | 'name' | 'email'>
    companies: { id: string; name: string } | null
  }

  const hasLocation = v.location_status === 'success' && v.latitude && v.longitude

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Link href="/admin/ziyaretler" className="hover:text-brand">← Ziyaretler</Link>
        </div>
        <DeleteVisitButton visitId={v.id} companyName={v.company_name_snapshot} />
      </div>

      <Card>
        <div className="flex items-start justify-between mb-6">
          <h2 className="text-lg font-bold text-gray-900">{v.company_name_snapshot}</h2>
          <LocationStatusBadge status={v.location_status} />
        </div>

        <dl className="space-y-4">
          <InfoRow icon={<User className="h-4 w-4 text-gray-400" />} label="Personel" value={v.profiles.name} />
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
          {v.location_status === 'manual' && v.address && (
            <InfoRow
              icon={<Navigation2 className="h-4 w-4 text-gray-400" />}
              label="Manuel Adres"
              value={v.address}
              multiline
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
          <VisitMap
            visits={[v]}
            height="320px"
            singleVisit
          />
        </Card>
      )}
    </div>
  )
}

function InfoRow({
  icon, label, value, multiline
}: {
  icon: React.ReactNode
  label: string
  value: string
  multiline?: boolean
}) {
  return (
    <div className="flex gap-3">
      <div className="mt-0.5">{icon}</div>
      <div>
        <dt className="text-xs text-gray-500 mb-0.5">{label}</dt>
        <dd className={`text-sm text-gray-900 ${multiline ? 'whitespace-pre-wrap' : ''}`}>{value}</dd>
      </div>
    </div>
  )
}
