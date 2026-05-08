import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { LocationStatusBadge } from '@/components/visits/LocationStatusBadge'
import { VisitStatusBadge } from '@/components/visits/VisitStatusBadge'
import { VisitMap } from '@/components/map/VisitMap'
import { formatDate, formatTime } from '@/lib/utils'
import { Building2, Clock, MapPin, FileText, Tag, Navigation2, UserCheck } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { PersonelEditVisitButton } from '@/components/visits/PersonelEditVisitButton'
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
    .eq('user_id', user.id)
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
        <div className="flex items-start justify-between mb-5 gap-4 flex-wrap">
          <h2 className="text-lg font-bold text-gray-900">{v.company_name_snapshot}</h2>
          <div className="flex gap-2 flex-wrap items-center">
            {v.status && <VisitStatusBadge status={v.status} />}
            <LocationStatusBadge status={v.location_status} />
            <PersonelEditVisitButton
              visit={{ id: v.id, note: v.note, status: v.status, visit_date: v.visit_date, contact_name: v.contact_name, contact_title: v.contact_title }}
              userId={user.id}
            />
          </div>
        </div>

        <dl className="space-y-4">
          <InfoRow icon={<Building2 className="h-4 w-4 text-gray-400" />} label="Firma" value={v.company_name_snapshot} />
          <InfoRow
            icon={<Clock className="h-4 w-4 text-gray-400" />}
            label="Tarih / Saat"
            value={`${formatDate(v.visit_date)} · ${formatTime(v.visit_time)}`}
          />
          {v.status && (
            <InfoRow
              icon={<Tag className="h-4 w-4 text-gray-400" />}
              label="Ziyaret Durumu"
              value={''}
              badge={<VisitStatusBadge status={v.status} />}
            />
          )}
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
              label="Adres"
              value={v.address}
              multiline
            />
          )}
          {(v.contact_name || v.contact_title) && (
            <InfoRow
              icon={<UserCheck className="h-4 w-4 text-gray-400" />}
              label="Görüşülen Kişi"
              value={[v.contact_name, v.contact_title].filter(Boolean).join(' — ')}
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

      {v.photo_url && (
        <Card padding={false} className="overflow-hidden">
          <div className="px-4 pt-4 pb-2">
            <p className="text-sm font-medium text-gray-700">Ziyaret Fotoğrafı</p>
          </div>
          <div className="relative w-full aspect-video">
            <Image
              src={v.photo_url}
              alt="Ziyaret fotoğrafı"
              fill
              className="object-cover"
              unoptimized
            />
          </div>
        </Card>
      )}

      {hasLocation && (
        <Card padding={false} className="overflow-hidden">
          <VisitMap visits={[v]} height="250px" singleVisit />
        </Card>
      )}
    </div>
  )
}

function InfoRow({
  icon, label, value, multiline, badge
}: {
  icon: React.ReactNode; label: string; value: string; multiline?: boolean; badge?: React.ReactNode
}) {
  if (badge) {
    return (
      <div className="flex gap-3">
        <div className="mt-0.5">{icon}</div>
        <div>
          <dt className="text-xs text-gray-400 mb-0.5">{label}</dt>
          <dd>{badge}</dd>
        </div>
      </div>
    )
  }
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
