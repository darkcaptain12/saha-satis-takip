'use client'
import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { LocationStatusBadge } from '@/components/visits/LocationStatusBadge'
import { VisitStatusBadge } from '@/components/visits/VisitStatusBadge'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatDate, formatTime, getTodayIso, getWeekRange, getMonthRange, getYearRange } from '@/lib/utils'
import { ClipboardList, SlidersHorizontal, X, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import type { Visit } from '@/types'

interface Props {
  visits: Visit[]
  current: {
    q?: string
    from?: string
    to?: string
    status?: string
  }
}

function groupByDate(visits: Visit[]): Record<string, Visit[]> {
  const grouped: Record<string, Visit[]> = {}
  visits.forEach((v) => {
    if (!grouped[v.visit_date]) grouped[v.visit_date] = []
    grouped[v.visit_date].push(v)
  })
  return grouped
}

export function ZiyaretlerimClient({ visits: initialVisits, current }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const [filterOpen, setFilterOpen] = useState(false)
  const [visits, setVisits] = useState<Visit[]>(initialVisits)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const hasFilters = !!(current.q || current.from || current.to || current.status)

  const push = (updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams()
    const merged = { ...current, ...updates }
    Object.entries(merged).forEach(([k, v]) => { if (v) params.set(k, v) })
    router.push(`${pathname}?${params.toString()}`)
  }

  const clearFilters = () => router.push(pathname)

  const setQuick = (range: 'today' | 'week' | 'month' | 'year') => {
    if (range === 'today') {
      const t = getTodayIso()
      push({ from: t, to: t })
    } else if (range === 'week') {
      push(getWeekRange())
    } else if (range === 'month') {
      push(getMonthRange())
    } else {
      push(getYearRange())
    }
    setFilterOpen(false)
  }

  const handleSiparisToggle = async (e: React.MouseEvent, visit: Visit) => {
    e.preventDefault()
    e.stopPropagation()
    if (togglingId) return

    const newStatus = visit.status === 'siparis_alindi' ? null : 'siparis_alindi'
    setTogglingId(visit.id)

    setVisits((prev) =>
      prev.map((v) => v.id === visit.id ? { ...v, status: newStatus } : v)
    )

    const { error } = await createClient()
      .from('visits')
      .update({ status: newStatus })
      .eq('id', visit.id)

    if (error) {
      // rollback
      setVisits((prev) =>
        prev.map((v) => v.id === visit.id ? { ...v, status: visit.status } : v)
      )
    }

    setTogglingId(null)
    router.refresh()
  }

  const grouped = groupByDate(visits)

  return (
    <div className="space-y-4">
      {/* Başlık + filtre toggle */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Ziyaretlerim</h1>
          <p className="text-sm text-gray-500 mt-0.5">{visits.length} kayıt</p>
        </div>
        <div className="flex items-center gap-2">
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1"
            >
              <X className="h-3.5 w-3.5" />
              Temizle
            </button>
          )}
          <button
            onClick={() => setFilterOpen((p) => !p)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
              filterOpen || hasFilters
                ? 'bg-brand text-white border-brand'
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filtrele
            {hasFilters && (
              <span className="ml-0.5 bg-white/30 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                {[current.q, current.from, current.to, current.status].filter(Boolean).length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Filtre paneli */}
      {filterOpen && (
        <Card className="p-4 space-y-3">
          {/* Hızlı filtreler */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setQuick('today')}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-700 hover:bg-brand hover:text-white transition-colors"
            >
              Bugün
            </button>
            <button
              onClick={() => setQuick('week')}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-700 hover:bg-brand hover:text-white transition-colors"
            >
              Bu Hafta
            </button>
            <button
              onClick={() => setQuick('month')}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-700 hover:bg-brand hover:text-white transition-colors"
            >
              Bu Ay
            </button>
            <button
              onClick={() => setQuick('year')}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-700 hover:bg-brand hover:text-white transition-colors"
            >
              Bu Yıl
            </button>
          </div>

          <div className="border-t border-gray-100 pt-3 space-y-3">
            <Input
              placeholder="Firma adında ara..."
              value={current.q ?? ''}
              onChange={(e) => push({ q: e.target.value || undefined })}
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                type="date"
                label="Başlangıç"
                value={current.from ?? ''}
                onChange={(e) => push({ from: e.target.value || undefined })}
              />
              <Input
                type="date"
                label="Bitiş"
                value={current.to ?? ''}
                onChange={(e) => push({ to: e.target.value || undefined })}
              />
            </div>
            <Select
              placeholder="Ziyaret Durumu"
              value={current.status ?? ''}
              onChange={(e) => push({ status: e.target.value || undefined })}
            >
              <option value="gorusuldu">Görüşüldü</option>
              <option value="teklif_verildi">Teklif Verildi</option>
              <option value="takip_gerekli">Takip Gerekli</option>
              <option value="siparis_alindi">Sipariş Alındı</option>
            </Select>
            <div className="flex gap-2 pt-1">
              <Button size="sm" variant="ghost" onClick={clearFilters} className="flex-1">
                Temizle
              </Button>
              <Button size="sm" onClick={() => setFilterOpen(false)} className="flex-1">
                Uygula
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Boş durum */}
      {Object.keys(grouped).length === 0 && (
        <EmptyState
          icon={<ClipboardList className="h-8 w-8" />}
          title={hasFilters ? 'Filtreye uygun ziyaret yok' : 'Henüz ziyaret kaydı yok'}
          description={
            hasFilters
              ? 'Farklı filtreler deneyin veya temizleyin.'
              : 'Yeni ziyaret oluşturmak için + butonunu kullanın.'
          }
          action={
            hasFilters ? (
              <button
                onClick={clearFilters}
                className="mt-2 inline-flex items-center gap-2 bg-brand text-white px-5 py-2.5 rounded-lg text-sm font-medium"
              >
                Filtreleri Temizle
              </button>
            ) : (
              <Link
                href="/personel/yeni-ziyaret"
                className="mt-2 inline-flex items-center gap-2 bg-brand text-white px-5 py-2.5 rounded-lg text-sm font-medium"
              >
                Yeni Ziyaret Oluştur
              </Link>
            )
          }
        />
      )}

      {/* Gruplu liste */}
      {Object.entries(grouped).map(([date, dayVisits]) => (
        <div key={date}>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 px-1">
            {formatDate(date)}
          </p>
          <Card padding={false}>
            <div className="divide-y divide-gray-50">
              {dayVisits.map((v) => (
                <Link
                  key={v.id}
                  href={`/personel/ziyaretlerim/${v.id}`}
                  className="flex items-center gap-3 px-4 py-4 hover:bg-gray-50 active:bg-gray-100"
                >
                  {/* Sipariş Alındı tiki */}
                  <button
                    type="button"
                    onClick={(e) => handleSiparisToggle(e, v)}
                    disabled={togglingId === v.id}
                    className={`shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center transition-colors ${
                      v.status === 'siparis_alindi'
                        ? 'bg-green-500 border-green-500 text-white'
                        : 'border-gray-300 text-transparent hover:border-green-400'
                    }`}
                    title={v.status === 'siparis_alindi' ? 'Sipariş alındı — kaldırmak için tıkla' : 'Sipariş alındı olarak işaretle'}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                  </button>

                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900 truncate">{v.company_name_snapshot}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{formatTime(v.visit_time)}</p>
                    {v.note && (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-1">{v.note}</p>
                    )}
                  </div>
                  <div className="ml-1 shrink-0 flex flex-col items-end gap-1">
                    {v.status && v.status !== 'siparis_alindi' && <VisitStatusBadge status={v.status} />}
                    <LocationStatusBadge status={v.location_status} />
                  </div>
                </Link>
              ))}
            </div>
          </Card>
        </div>
      ))}
    </div>
  )
}
