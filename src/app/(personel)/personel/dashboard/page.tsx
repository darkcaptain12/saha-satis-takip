import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { LocationStatusBadge } from '@/components/visits/LocationStatusBadge'
import { formatDate, formatTime } from '@/lib/utils'
import { StatCard } from '@/components/dashboard/StatCard'
import Link from 'next/link'
import { PlusCircle, ClipboardList, MapPin, Calendar } from 'lucide-react'
import type { Visit } from '@/types'

export default async function PersonelDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const today = new Date().toISOString().slice(0, 10)
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString().slice(0, 10)

  const [
    { count: todayCount },
    { count: monthCount },
    { data: recentVisits },
  ] = await Promise.all([
    supabase.from('visits').select('*', { count: 'exact', head: true })
      .eq('user_id', user.id).eq('visit_date', today),
    supabase.from('visits').select('*', { count: 'exact', head: true })
      .eq('user_id', user.id).gte('visit_date', monthStart),
    supabase.from('visits')
      .select('id, company_name_snapshot, visit_date, visit_time, location_status')
      .eq('user_id', user.id)
      .order('visit_date', { ascending: false })
      .order('visit_time', { ascending: false })
      .limit(5),
  ])

  return (
    <div className="space-y-5">
      {/* Hızlı erişim */}
      <Link
        href="/personel/yeni-ziyaret"
        className="flex items-center justify-center gap-3 bg-brand text-white rounded-xl py-4 font-semibold text-base shadow-lg shadow-brand/20 active:scale-95 transition-transform"
      >
        <PlusCircle className="h-5 w-5" />
        Yeni Ziyaret Kaydı Oluştur
      </Link>

      {/* İstatistikler */}
      <div className="grid grid-cols-2 gap-4">
        <StatCard
          title="Bugün"
          value={todayCount ?? 0}
          icon={<Calendar className="h-5 w-5" />}
          color="blue"
          subtitle="ziyaret"
        />
        <StatCard
          title="Bu Ay"
          value={monthCount ?? 0}
          icon={<MapPin className="h-5 w-5" />}
          color="green"
          subtitle="ziyaret"
        />
      </div>

      {/* Son ziyaretler */}
      <Card padding={false}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Son Ziyaretlerim</h2>
          <Link href="/personel/ziyaretlerim" className="text-sm text-brand">
            Tümü →
          </Link>
        </div>
        <div className="divide-y divide-gray-50">
          {(recentVisits as Visit[])?.map((v) => (
            <Link
              key={v.id}
              href={`/personel/ziyaretlerim/${v.id}`}
              className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 active:bg-gray-100"
            >
              <div className="min-w-0">
                <p className="font-medium text-gray-900 text-sm truncate">{v.company_name_snapshot}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {formatDate(v.visit_date)} · {formatTime(v.visit_time)}
                </p>
              </div>
              <LocationStatusBadge status={v.location_status} />
            </Link>
          ))}
          {(!recentVisits || recentVisits.length === 0) && (
            <div className="text-center py-10">
              <ClipboardList className="h-8 w-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400">Henüz ziyaret kaydı yok.</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
