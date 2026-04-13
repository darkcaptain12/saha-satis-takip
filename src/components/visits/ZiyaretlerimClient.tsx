'use client'
import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { LocationStatusBadge } from '@/components/visits/LocationStatusBadge'
import { VisitStatusBadge } from '@/components/visits/VisitStatusBadge'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatDate, formatTime } from '@/lib/utils'
import { ClipboardList, SlidersHorizontal, X } from 'lucide-react'
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

// Tarihe göre grupla
function groupByDate(visits: Visit[]): Record<string, Visit[]> {
  const grouped: Record<string, Visit[]> = {}
  visits.forEach((v) => {
    if (!grouped[v.visit_date]) grouped[v.visit_date] = []
    grouped[v.visit_date].push(v)
  })
  return grouped
}

export function ZiyaretlerimClient({ visits, current }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const [filterOpen, setFilterOpen] = useState(false)

  const hasFilters = !!(current.q || current.from || current.to || current.status)

  const push = (updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams()
    const merged = { ...current, ...updates }
    Object.entries(merged).forEach(([k, v]) => { if (v) params.set(k, v) })
    router.push(`${pathname}?${params.toString()}`)
  }

  const clearFilters = () => router.push(pathname)

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
                  className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 active:bg-gray-100"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900 truncate">{v.company_name_snapshot}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{formatTime(v.visit_time)}</p>
                    {v.note && (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-1">{v.note}</p>
                    )}
                  </div>
                  <div className="ml-3 shrink-0 flex flex-col items-end gap-1">
                    {v.status && <VisitStatusBadge status={v.status} />}
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
