import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { LocationStatusBadge } from '@/components/visits/LocationStatusBadge'
import { formatDate, formatTime } from '@/lib/utils'
import Link from 'next/link'
import { Building2, Phone, MapPin, FileText } from 'lucide-react'
import type { VisitWithProfile } from '@/types'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function AdminFirmaDetayPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: company }, { data: visits }] = await Promise.all([
    supabase.from('companies').select('*').eq('id', id).single(),
    supabase.from('visits')
      .select('*, profiles(id, name, email)')
      .eq('company_id', id)
      .order('visit_date', { ascending: false })
      .limit(100),
  ])

  if (!company) notFound()

  return (
    <div className="max-w-3xl space-y-5">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/admin/firmalar" className="hover:text-brand">← Firmalar</Link>
      </div>

      <Card>
        <div className="flex items-start gap-5">
          <div className="bg-brand/10 rounded-2xl p-4 shrink-0">
            <Building2 className="h-8 w-8 text-brand" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900 mb-3">{company.name}</h2>
            <dl className="space-y-2">
              {company.address && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="h-3.5 w-3.5 text-gray-400" />
                  {company.address}
                </div>
              )}
              {company.phone && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone className="h-3.5 w-3.5 text-gray-400" />
                  {company.phone}
                </div>
              )}
              {company.note && (
                <div className="flex items-start gap-2 text-sm text-gray-600">
                  <FileText className="h-3.5 w-3.5 text-gray-400 mt-0.5" />
                  {company.note}
                </div>
              )}
            </dl>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-2xl font-bold text-gray-900 inline">{visits?.length ?? 0}</p>
              <span className="text-sm text-gray-500 ml-2">toplam ziyaret</span>
            </div>
          </div>
        </div>
      </Card>

      <Card padding={false}>
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Ziyaret Geçmişi</h3>
        </div>
        <div className="divide-y divide-gray-50">
          {(visits as unknown as VisitWithProfile[])?.map((v) => (
            <Link
              key={v.id}
              href={`/admin/ziyaretler/${v.id}`}
              className="flex items-center justify-between px-6 py-3.5 hover:bg-gray-50 transition-colors"
            >
              <div>
                <p className="text-sm font-medium text-gray-900">{v.profiles?.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {formatDate(v.visit_date)} · {formatTime(v.visit_time)}
                </p>
                {v.note && <p className="text-xs text-gray-500 mt-1 line-clamp-1">{v.note}</p>}
              </div>
              <LocationStatusBadge status={v.location_status} />
            </Link>
          ))}
          {(!visits || visits.length === 0) && (
            <p className="text-center py-10 text-sm text-gray-400">Bu firmaya ait ziyaret kaydı yok.</p>
          )}
        </div>
      </Card>
    </div>
  )
}
