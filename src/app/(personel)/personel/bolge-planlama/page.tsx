import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { BolgePlanlamaMap } from '@/components/map/BolgePlanlamaMap'
import type { CompanyMarker } from '@/components/map/BolgePlanlamaInner'

export default async function BolgePlanlamaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Koordinatı olan tüm firmalar
  const { data: companies } = await supabase
    .from('companies')
    .select('id, name, address, latitude, longitude')
    .not('latitude', 'is', null)
    .not('longitude', 'is', null)
    .order('name')

  // Bu personelin ziyaretleri → company_id → son tarih
  const { data: visits } = await supabase
    .from('visits')
    .select('company_id, visit_date')
    .eq('user_id', user.id)
    .not('company_id', 'is', null)
    .order('visit_date', { ascending: false })

  // company_id → son ziyaret tarihi map'i
  const lastVisitMap: Record<string, string> = {}
  for (const v of (visits ?? []) as { company_id: string; visit_date: string }[]) {
    if (v.company_id && !lastVisitMap[v.company_id]) {
      lastVisitMap[v.company_id] = v.visit_date
    }
  }

  // Firma listesini CompanyMarker formatına dönüştür
  type CompanyRow = { id: string; name: string; address: string | null; latitude: number; longitude: number }
  const markers: CompanyMarker[] = ((companies ?? []) as CompanyRow[]).map((c) => ({
    id: c.id,
    name: c.name,
    address: c.address ?? null,
    latitude: c.latitude as number,
    longitude: c.longitude as number,
    lastVisitDate: lastVisitMap[c.id] ?? null,
    distanceMeters: null,
  }))

  // Koordinat henüz yüklenmemişse yönlendirme mesajı göster
  if (markers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-64 text-center p-6 gap-4">
        <div className="text-4xl">🗺️</div>
        <div>
          <p className="font-semibold text-gray-800">Harita için koordinat gerekli</p>
          <p className="text-sm text-gray-500 mt-1">
            Okul koordinatları henüz yüklenmemiş. Admin panelinden
            <br />
            <strong>Firmalar → Koordinatları Doldur</strong> butonunu çalıştırın.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 56px - 64px)' }}>
      <div className="px-4 py-3 bg-white border-b border-gray-100">
        <h1 className="text-base font-bold text-gray-900">Bölge Planlama</h1>
        <p className="text-xs text-gray-500 mt-0.5">
          {markers.length} okul/firma · 🔴 Ziyaret edilmedi · 🟢 Ziyaret edildi
        </p>
      </div>
      <div className="flex-1 overflow-hidden">
        <BolgePlanlamaMap companies={markers} />
      </div>
    </div>
  )
}
