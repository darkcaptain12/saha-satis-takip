'use client'
import { useState, useMemo } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { StatCard } from '@/components/dashboard/StatCard'
import { formatTime, getWeekRange, getMonthRange, getTodayIso } from '@/lib/utils'
import { Download, BarChart3, Users, Building2 } from 'lucide-react'
import type { VisitWithProfile } from '@/types'

interface Props {
  visits: VisitWithProfile[]
  staff: { id: string; name: string }[]
}

type Range = 'week' | 'month' | 'all'

export function RaporlarClient({ visits }: Props) {
  const [range, setRange] = useState<Range>('month')

  const filtered = useMemo(() => {
    if (range === 'all') return visits
    const { from, to } = range === 'week' ? getWeekRange() : getMonthRange()
    return visits.filter(v => v.visit_date >= from && v.visit_date <= to)
  }, [visits, range])

  // Personel bazlı özet
  const staffSummary = useMemo(() => {
    const map: Record<string, { name: string; count: number }> = {}
    filtered.forEach((v) => {
      const id = v.profiles?.id ?? v.user_id
      if (!map[id]) map[id] = { name: v.profiles?.name ?? 'Bilinmiyor', count: 0 }
      map[id].count++
    })
    return Object.values(map).sort((a, b) => b.count - a.count)
  }, [filtered])

  // Firma bazlı özet
  const companySummary = useMemo(() => {
    const map: Record<string, number> = {}
    filtered.forEach((v) => {
      map[v.company_name_snapshot] = (map[v.company_name_snapshot] ?? 0) + 1
    })
    return Object.entries(map)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
  }, [filtered])

  const statusLabel = (s: string | null) => {
    if (s === 'gorusuldu') return 'Görüşüldü'
    if (s === 'teklif_verildi') return 'Teklif Verildi'
    if (s === 'takip_gerekli') return 'Takip Gerekli'
    if (s === 'siparis_alindi') return 'Sipariş Alındı'
    return ''
  }

  const exportCSV = () => {
    const rows = [
      ['Tarih', 'Saat', 'Personel', 'Firma', 'Ziyaret Durumu', 'Not', 'Konum Durumu'],
      ...filtered.map((v) => [
        v.visit_date,
        formatTime(v.visit_time),
        v.profiles?.name ?? '',
        v.company_name_snapshot,
        statusLabel(v.status),
        v.note?.replace(/\n/g, ' ') ?? '',
        v.location_status === 'success' ? 'Alındı' : v.location_status === 'failed' ? 'Alınamadı' : v.location_status === 'manual' ? 'Manuel Adres' : 'Atlandı',
      ]),
    ]
    const csv = '\uFEFF' + rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ziyaretler_${getTodayIso()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const rangeLabels: Record<Range, string> = {
    week: 'Bu Hafta',
    month: 'Bu Ay',
    all: 'Tümü',
  }

  return (
    <div className="space-y-6">
      {/* Filtre + Export */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          {(Object.keys(rangeLabels) as Range[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                range === r
                  ? 'bg-brand text-white'
                  : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {rangeLabels[r]}
            </button>
          ))}
        </div>
        <Button variant="secondary" size="sm" onClick={exportCSV}>
          <Download className="h-4 w-4" />
          CSV İndir
        </Button>
      </div>

      {/* Özet kartlar */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          title="Toplam Ziyaret"
          value={filtered.length}
          icon={<BarChart3 className="h-5 w-5" />}
          color="blue"
        />
        <StatCard
          title="Aktif Personel"
          value={new Set(filtered.map(v => v.user_id)).size}
          icon={<Users className="h-5 w-5" />}
          color="green"
        />
        <StatCard
          title="Farklı Firma"
          value={new Set(filtered.map(v => v.company_name_snapshot)).size}
          icon={<Building2 className="h-5 w-5" />}
          color="purple"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Personel bazlı */}
        <Card>
          <h3 className="font-semibold text-gray-900 mb-4">Personel Performansı</h3>
          {staffSummary.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">Kayıt yok.</p>
          ) : (
            <div className="space-y-3">
              {staffSummary.map(({ name, count }) => {
                const pct = filtered.length > 0 ? (count / filtered.length) * 100 : 0
                return (
                  <div key={name}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-700 font-medium">{name}</span>
                      <span className="text-gray-500">{count} ziyaret</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-brand rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>

        {/* Firma bazlı */}
        <Card>
          <h3 className="font-semibold text-gray-900 mb-4">En Çok Ziyaret Edilen Firmalar</h3>
          {companySummary.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">Kayıt yok.</p>
          ) : (
            <div className="space-y-2">
              {companySummary.map(({ name, count }, i) => (
                <div key={name} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-bold text-gray-400 w-5">{i + 1}</span>
                    <span className="text-sm text-gray-700 truncate max-w-[200px]">{name}</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">{count}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
