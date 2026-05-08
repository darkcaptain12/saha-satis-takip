'use client'
import { useRouter, usePathname } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { Input } from '@/components/ui/Input'
import { getTodayIso, getWeekRange, getMonthRange, getYearRange } from '@/lib/utils'

interface Profile { id: string; name: string }
interface Company { id: string; name: string }

interface AdminVisitFiltersProps {
  staff: Profile[]
  companies: Company[]
  current: {
    staff?: string
    company?: string
    from?: string
    to?: string
    status?: string
    vstatus?: string
    q?: string
  }
}

export function AdminVisitFilters({ staff, companies, current }: AdminVisitFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()

  const push = (updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams()
    const merged = { ...current, ...updates }
    Object.entries(merged).forEach(([k, v]) => {
      if (v) params.set(k, v)
    })
    router.push(`${pathname}?${params.toString()}`)
  }

  const setQuickFilter = (range: 'today' | 'week' | 'month' | 'year') => {
    if (range === 'today') {
      const today = getTodayIso()
      push({ from: today, to: today })
    } else if (range === 'week') {
      const { from, to } = getWeekRange()
      push({ from, to })
    } else if (range === 'month') {
      const { from, to } = getMonthRange()
      push({ from, to })
    } else {
      const { from, to } = getYearRange()
      push({ from, to })
    }
  }

  const clearFilters = () => router.push(pathname)

  return (
    <Card className="p-4">
      <div className="flex flex-wrap gap-2 mb-3">
        <Button variant="secondary" size="sm" onClick={() => setQuickFilter('today')}>Bugün</Button>
        <Button variant="secondary" size="sm" onClick={() => setQuickFilter('week')}>Bu Hafta</Button>
        <Button variant="secondary" size="sm" onClick={() => setQuickFilter('month')}>Bu Ay</Button>
        <Button variant="secondary" size="sm" onClick={() => setQuickFilter('year')}>Bu Yıl</Button>
        <Button variant="ghost" size="sm" onClick={clearFilters}>Temizle</Button>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-3">
        <Input
          placeholder="Okul adı ara..."
          value={current.q ?? ''}
          onChange={(e) => push({ q: e.target.value || undefined })}
        />
        <Select
          placeholder="Tüm Personel"
          value={current.staff ?? ''}
          onChange={(e) => push({ staff: e.target.value || undefined })}
        >
          {staff.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </Select>

        <Select
          placeholder="Tüm Firmalar"
          value={current.company ?? ''}
          onChange={(e) => push({ company: e.target.value || undefined })}
        >
          {companies.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </Select>

        <Select
          placeholder="Ziyaret Durumu"
          value={current.vstatus ?? ''}
          onChange={(e) => push({ vstatus: e.target.value || undefined })}
        >
          <option value="gorusuldu">Görüşüldü</option>
          <option value="teklif_verildi">Teklif Verildi</option>
          <option value="takip_gerekli">Takip Gerekli</option>
          <option value="siparis_alindi">Sipariş Alındı</option>
        </Select>

        <Select
          placeholder="Konum Durumu"
          value={current.status ?? ''}
          onChange={(e) => push({ status: e.target.value || undefined })}
        >
          <option value="success">Konum Alındı</option>
          <option value="failed">Alınamadı</option>
          <option value="skipped">Atlandı</option>
          <option value="manual">Manuel Adres</option>
        </Select>

        <Input
          type="date"
          placeholder="Başlangıç"
          value={current.from ?? ''}
          onChange={(e) => push({ from: e.target.value || undefined })}
        />
        <Input
          type="date"
          placeholder="Bitiş"
          value={current.to ?? ''}
          onChange={(e) => push({ to: e.target.value || undefined })}
        />
      </div>
    </Card>
  )
}
