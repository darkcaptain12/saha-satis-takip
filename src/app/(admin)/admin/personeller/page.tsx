import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'
import { AdminStaffActions } from '@/components/staff/AdminStaffActions'
import { User } from 'lucide-react'

export default async function AdminPersonellerPage() {
  const supabase = await createClient()

  const { data: staff } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'personel')
    .order('name')

  // Kişi başına ziyaret sayıları
  const { data: visitCounts } = await supabase
    .from('visits')
    .select('user_id')

  const countMap: Record<string, number> = {}
  visitCounts?.forEach((v: { user_id: string }) => {
    countMap[v.user_id] = (countMap[v.user_id] ?? 0) + 1
  })

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <AdminStaffActions mode="add" />
      </div>

      <Card padding={false}>
        {/* Desktop */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Personel</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">E-posta</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Ziyaret</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Durum</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Kayıt</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(staff as import('@/types').Profile[])?.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <Link href={`/admin/personeller/${p.id}`} className="font-medium text-brand hover:underline">
                      {p.name}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-gray-500">{p.email}</td>
                  <td className="px-6 py-4 text-gray-700 font-medium">{countMap[p.id] ?? 0}</td>
                  <td className="px-6 py-4">
                    <Badge variant={p.active ? 'green' : 'gray'}>
                      {p.active ? 'Aktif' : 'Pasif'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-gray-400 text-xs">{formatDate(p.created_at)}</td>
                  <td className="px-6 py-4">
                    <AdminStaffActions mode="edit" profile={p} />
                  </td>
                </tr>
              ))}
              {(!staff || staff.length === 0) && (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-400">Henüz personel yok.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile */}
        <div className="lg:hidden divide-y divide-gray-100">
          {(staff as import('@/types').Profile[])?.map((p) => (
            <div key={p.id} className="flex items-center justify-between px-4 py-4 gap-3">
              <Link href={`/admin/personeller/${p.id}`} className="flex items-center gap-3 min-w-0">
                <div className="bg-brand/10 rounded-full p-2.5 shrink-0">
                  <User className="h-4 w-4 text-brand" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 truncate">{p.name}</p>
                  <p className="text-xs text-gray-500 truncate">{p.email}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{countMap[p.id] ?? 0} ziyaret</p>
                </div>
              </Link>
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant={p.active ? 'green' : 'gray'}>
                  {p.active ? 'Aktif' : 'Pasif'}
                </Badge>
                <AdminStaffActions mode="edit" profile={p} />
              </div>
            </div>
          ))}
          {(!staff || staff.length === 0) && (
            <p className="text-center py-12 text-gray-400 text-sm">Henüz personel yok.</p>
          )}
        </div>
      </Card>
    </div>
  )
}
