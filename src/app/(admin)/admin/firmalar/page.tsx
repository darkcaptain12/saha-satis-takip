import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/Card'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'
import { AdminCompanyActions } from '@/components/companies/AdminCompanyActions'
import { AdminGeocodeButton } from '@/components/companies/AdminGeocodeButton'
import { Building2 } from 'lucide-react'

export default async function AdminFirmalarPage() {
  const supabase = await createClient()

  const [{ data: companies }, { data: visitCounts }] = await Promise.all([
    supabase
      .from('companies')
      .select('id, name, address, phone, note, latitude, longitude, created_at')
      .order('name'),
    supabase.rpc('get_company_visit_counts'),
  ])

  const countMap: Record<string, number> = {}
  ;(visitCounts ?? []).forEach((r: { company_id: string; visit_count: number }) => {
    countMap[r.company_id] = Number(r.visit_count)
  })

  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2">
        <AdminGeocodeButton />
        <AdminCompanyActions mode="add" />
      </div>

      <Card padding={false}>
        {/* Desktop */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Firma Adı</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Adres</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Telefon</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Ziyaret</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Kayıt</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(companies as import('@/types').Company[])?.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <Link href={`/admin/firmalar/${c.id}`} className="font-medium text-brand hover:underline">
                      {c.name}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-gray-500">{c.address ?? '-'}</td>
                  <td className="px-6 py-4 text-gray-500">{c.phone ?? '-'}</td>
                  <td className="px-6 py-4 font-medium text-gray-700">{countMap[c.id] ?? 0}</td>
                  <td className="px-6 py-4 text-gray-400 text-xs">{formatDate(c.created_at)}</td>
                  <td className="px-6 py-4">
                    <AdminCompanyActions mode="edit" company={c} />
                  </td>
                </tr>
              ))}
              {(!companies || companies.length === 0) && (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-400">Henüz firma yok.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile */}
        <div className="lg:hidden divide-y divide-gray-100">
          {(companies as import('@/types').Company[])?.map((c) => (
            <div key={c.id} className="flex items-center justify-between px-4 py-4 gap-3">
              <Link href={`/admin/firmalar/${c.id}`} className="flex items-center gap-3 min-w-0">
                <div className="bg-brand/10 rounded-full p-2.5 shrink-0">
                  <Building2 className="h-4 w-4 text-brand" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 truncate">{c.name}</p>
                  {c.address && <p className="text-xs text-gray-500 truncate">{c.address}</p>}
                  <p className="text-xs text-gray-400 mt-0.5">{countMap[c.id] ?? 0} ziyaret</p>
                </div>
              </Link>
              <AdminCompanyActions mode="edit" company={c} />
            </div>
          ))}
          {(!companies || companies.length === 0) && (
            <p className="text-center py-12 text-gray-400 text-sm">Henüz firma yok.</p>
          )}
        </div>
      </Card>
    </div>
  )
}
