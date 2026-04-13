import { createClient } from '@/lib/supabase/server'
import { StatCard } from '@/components/dashboard/StatCard'
import { Card } from '@/components/ui/Card'
import { LocationStatusBadge } from '@/components/visits/LocationStatusBadge'
import { formatDate, formatTime } from '@/lib/utils'
import { Users, MapPin, Calendar } from 'lucide-react'
import Link from 'next/link'
import type { VisitWithProfile } from '@/types'

export default async function AdminDashboardPage() {
  const supabase = await createClient()
  const today = new Date().toISOString().slice(0, 10)
  const weekStart = (() => {
    const d = new Date()
    const day = d.getDay()
    const diff = day === 0 ? -6 : 1 - day
    d.setDate(d.getDate() + diff)
    return d.toISOString().slice(0, 10)
  })()
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10)

  const [
    { count: todayCount },
    { count: weekCount },
    { count: monthCount },
    { count: staffCount },
    { count: companyCount },
    { data: recentVisits },
  ] = await Promise.all([
    supabase.from('visits').select('*', { count: 'exact', head: true }).eq('visit_date', today),
    supabase.from('visits').select('*', { count: 'exact', head: true }).gte('visit_date', weekStart),
    supabase.from('visits').select('*', { count: 'exact', head: true }).gte('visit_date', monthStart),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'personel').eq('active', true),
    supabase.from('companies').select('*', { count: 'exact', head: true }),
    supabase.from('visits')
      .select('*, profiles(id, name, email)')
      .order('created_at', { ascending: false })
      .limit(10),
  ])

  return (
    <div className="space-y-6">
      {/* İstatistik kartları */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Bugün" value={todayCount ?? 0} icon={<Calendar className="h-5 w-5" />} color="blue" subtitle="ziyaret kaydı" />
        <StatCard title="Bu Hafta" value={weekCount ?? 0} icon={<MapPin className="h-5 w-5" />} color="green" subtitle="ziyaret kaydı" />
        <StatCard title="Bu Ay" value={monthCount ?? 0} icon={<BarChartIcon />} color="purple" subtitle="ziyaret kaydı" />
        <StatCard title="Aktif Personel" value={staffCount ?? 0} icon={<Users className="h-5 w-5" />} color="orange" subtitle={`/ ${companyCount ?? 0} firma`} />
      </div>

      {/* Son ziyaretler */}
      <Card padding={false}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Son Ziyaretler</h2>
          <Link href="/admin/ziyaretler" className="text-sm text-brand hover:underline">
            Tümünü Gör →
          </Link>
        </div>
        <div className="divide-y divide-gray-50">
          {recentVisits?.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-10">Henüz ziyaret kaydı yok.</p>
          )}
          {(recentVisits as unknown as VisitWithProfile[])?.map((v) => (
            <Link
              key={v.id}
              href={`/admin/ziyaretler/${v.id}`}
              className="flex items-center justify-between px-6 py-3.5 hover:bg-gray-50 transition-colors"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{v.company_name_snapshot}</p>
                <p className="text-xs text-gray-500">
                  {v.profiles?.name} · {formatDate(v.visit_date)} {formatTime(v.visit_time)}
                </p>
              </div>
              <LocationStatusBadge status={v.location_status} />
            </Link>
          ))}
        </div>
      </Card>
    </div>
  )
}

function BarChartIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  )
}
