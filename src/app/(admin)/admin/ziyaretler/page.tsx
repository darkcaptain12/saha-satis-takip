import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/Card'
import { LocationStatusBadge } from '@/components/visits/LocationStatusBadge'
import { VisitStatusBadge } from '@/components/visits/VisitStatusBadge'
import { formatDate, formatTime } from '@/lib/utils'
import Link from 'next/link'
import { AdminVisitFilters } from '@/components/visits/AdminVisitFilters'
import type { VisitWithProfile } from '@/types'

interface PageProps {
  searchParams: Promise<{
    staff?: string
    company?: string
    from?: string
    to?: string
    status?: string
    vstatus?: string
  }>
}

export default async function AdminZiyaretlerPage({ searchParams }: PageProps) {
  const params = await searchParams
  const supabase = await createClient()

  const [{ data: staff }, { data: companies }] = await Promise.all([
    supabase.from('profiles').select('id, name').eq('role', 'personel').eq('active', true).order('name'),
    supabase.from('companies').select('id, name').order('name'),
  ])

  let query = supabase
    .from('visits')
    .select('*, profiles(id, name, email)')
    .order('visit_date', { ascending: false })
    .order('visit_time', { ascending: false })

  if (params.staff)   query = query.eq('user_id', params.staff)
  if (params.company) query = query.eq('company_id', params.company)
  if (params.from)    query = query.gte('visit_date', params.from)
  if (params.to)      query = query.lte('visit_date', params.to)
  if (params.status)  query = query.eq('location_status', params.status)
  if (params.vstatus) query = query.eq('status', params.vstatus)

  const { data: visits } = await query.limit(200)

  return (
    <div className="space-y-4">
      <AdminVisitFilters staff={staff ?? []} companies={companies ?? []} current={params} />

      <Card padding={false}>
        <div className="px-6 py-3 border-b border-gray-100 flex items-center justify-between">
          <span className="text-sm text-gray-500">
            {visits?.length ?? 0} kayıt
          </span>
        </div>

        {/* Desktop table */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Tarih / Saat</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Personel</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Firma</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Durum</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Konum</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Not</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(visits as unknown as VisitWithProfile[])?.map((v) => (
                <tr key={v.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <Link href={`/admin/ziyaretler/${v.id}`} className="text-brand hover:underline font-medium">
                      {formatDate(v.visit_date)}
                    </Link>
                    <p className="text-gray-400 text-xs mt-0.5">{formatTime(v.visit_time)}</p>
                  </td>
                  <td className="px-6 py-4 text-gray-700">{v.profiles?.name}</td>
                  <td className="px-6 py-4 text-gray-900 font-medium">{v.company_name_snapshot}</td>
                  <td className="px-6 py-4">
                    <VisitStatusBadge status={v.status} />
                    {!v.status && <span className="text-xs text-gray-300">—</span>}
                  </td>
                  <td className="px-6 py-4">
                    <LocationStatusBadge status={v.location_status} />
                  </td>
                  <td className="px-6 py-4 text-gray-500 max-w-xs truncate">{v.note ?? '-'}</td>
                </tr>
              ))}
              {(!visits || visits.length === 0) && (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-400 text-sm">
                    Filtrelere uygun ziyaret kaydı bulunamadı.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="lg:hidden divide-y divide-gray-50">
          {(visits as unknown as VisitWithProfile[])?.map((v) => (
            <Link
              key={v.id}
              href={`/admin/ziyaretler/${v.id}`}
              className="block px-4 py-4 hover:bg-gray-50"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 truncate">{v.company_name_snapshot}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {v.profiles?.name} · {formatDate(v.visit_date)} {formatTime(v.visit_time)}
                  </p>
                  {v.note && <p className="text-xs text-gray-400 mt-1 line-clamp-2">{v.note}</p>}
                </div>
                <div className="flex flex-col gap-1 items-end shrink-0">
                  {v.status && <VisitStatusBadge status={v.status} />}
                  <LocationStatusBadge status={v.location_status} />
                </div>
              </div>
            </Link>
          ))}
          {(!visits || visits.length === 0) && (
            <p className="text-center py-12 text-gray-400 text-sm">Kayıt bulunamadı.</p>
          )}
        </div>
      </Card>
    </div>
  )
}
