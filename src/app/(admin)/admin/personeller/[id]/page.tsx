import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { LocationStatusBadge } from '@/components/visits/LocationStatusBadge'
import { formatDate, formatTime } from '@/lib/utils'
import Link from 'next/link'
import { User, Mail } from 'lucide-react'
import type { Visit } from '@/types'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function AdminPersonelDetayPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: profile }, { data: visits }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', id).single(),
    supabase.from('visits')
      .select('*')
      .eq('user_id', id)
      .order('visit_date', { ascending: false })
      .order('visit_time', { ascending: false })
      .limit(100),
  ])

  if (!profile) notFound()

  const p = profile as import('@/types').Profile
  const typedVisits = (visits ?? []) as Visit[]
  const today = new Date().toISOString().slice(0, 10)
  const todayCount = typedVisits.filter(v => v.visit_date === today).length

  return (
    <div className="max-w-3xl space-y-5">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/admin/personeller" className="hover:text-brand">← Personeller</Link>
      </div>

      {/* Profil kartı */}
      <Card>
        <div className="flex items-start gap-5">
          <div className="bg-brand/10 rounded-2xl p-4">
            <User className="h-8 w-8 text-brand" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-xl font-bold text-gray-900">{p.name}</h2>
              <Badge variant={p.active ? 'green' : 'gray'}>
                {p.active ? 'Aktif' : 'Pasif'}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
              <Mail className="h-3.5 w-3.5" />
              {p.email}
            </div>
            <div className="grid grid-cols-3 gap-4 mt-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{typedVisits.length}</p>
                <p className="text-xs text-gray-500">Toplam Ziyaret</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{todayCount}</p>
                <p className="text-xs text-gray-500">Bugün</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">
                  {typedVisits.filter(v => v.location_status === 'success').length}
                </p>
                <p className="text-xs text-gray-500">Konumlu</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Ziyaret geçmişi */}
      <Card padding={false}>
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Ziyaret Geçmişi</h3>
        </div>
        <div className="divide-y divide-gray-50">
          {typedVisits.map((v: Visit) => (
            <Link
              key={v.id}
              href={`/admin/ziyaretler/${v.id}`}
              className="flex items-center justify-between px-6 py-3.5 hover:bg-gray-50 transition-colors"
            >
              <div>
                <p className="text-sm font-medium text-gray-900">{v.company_name_snapshot}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {formatDate(v.visit_date)} · {formatTime(v.visit_time)}
                </p>
                {v.note && <p className="text-xs text-gray-500 mt-1 line-clamp-1">{v.note}</p>}
              </div>
              <LocationStatusBadge status={v.location_status} />
            </Link>
          ))}
          {typedVisits.length === 0 && (
            <p className="text-center py-10 text-sm text-gray-400">Bu personele ait ziyaret kaydı yok.</p>
          )}
        </div>
      </Card>
    </div>
  )
}
