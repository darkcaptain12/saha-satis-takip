'use client'
import { useState, useRef } from 'react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { createClient } from '@/lib/supabase/client'
import { MapPin } from 'lucide-react'

type GeoStatus = 'idle' | 'running' | 'done'

// Bursa ilçe merkezi koordinatları
const BURSA_DISTRICTS: Record<string, [number, number]> = {
  'OSMANGAZİ':          [40.1885, 29.0610],
  'NİLÜFER':            [40.2117, 28.9786],
  'YILDIRIM':           [40.1954, 29.1108],
  'GEMLİK':             [40.4316, 29.1538],
  'MUDANYA':            [40.3753, 28.8828],
  'KESTEL':             [40.1960, 29.2250],
  'GÜRSU':              [40.2231, 29.1880],
  'KARACABEYİ':         [40.2161, 28.3583],
  'KARACABEY':          [40.2161, 28.3583],
  'İNEGÖL':             [40.0762, 29.5133],
  'INEGÖL':             [40.0762, 29.5133],
  'MUSTAFAKEMALPAŞA':   [40.0377, 28.4091],
  'İZNİK':              [40.4303, 29.7228],
  'IZNIK':              [40.4303, 29.7228],
  'ORHANELİ':           [39.9037, 28.9985],
  'BÜYÜKORHAN':         [39.8143, 29.0278],
  'KELES':              [39.9112, 29.2273],
  'HARMANCIK':          [39.6737, 29.1505],
  'ORHANGAZİ':          [40.4856, 29.3133],
  'YENİŞEHİR':          [40.2647, 29.6450],
}

// note alanından ilçeyi çıkar: "İlçe: Gemlik | Tür: İlkokul" → "GEMLİK"
function extractDistrict(note: string | null): string | null {
  if (!note) return null
  const m = note.match(/İlçe:\s*([^|]+)/)
  if (!m) return null
  return m[1].trim().toUpperCase()
    .replace('I', 'İ') // küçük harf i → büyük İ düzeltmesi
}

// İlçe merkezine ±offset kadar rastgele dağıtım (her okul aynı noktada olmasın)
function withOffset(lat: number, lon: number): [number, number] {
  const range = 0.004 // ~400m
  const dlat = (Math.random() - 0.5) * range
  const dlon = (Math.random() - 0.5) * range
  return [
    parseFloat((lat + dlat).toFixed(6)),
    parseFloat((lon + dlon).toFixed(6)),
  ]
}

export function AdminGeocodeButton() {
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState<GeoStatus>('idle')
  const [total, setTotal] = useState(0)
  const [found, setFound] = useState(0)
  const [notFound, setNotFound] = useState(0)
  const abortRef = useRef(false)

  const handleStart = async () => {
    const supabase = createClient()
    abortRef.current = false
    setFound(0)
    setNotFound(0)
    setStatus('running')

    // note alanı gerekli: ilçe bilgisi için
    const { data: companies, error } = await supabase
      .from('companies')
      .select('id, name, note')
      .is('latitude', null)

    if (error || !companies || companies.length === 0) {
      setStatus('done')
      return
    }

    setTotal(companies.length)

    // Toplu güncelleme: her ilçe için koordinat ata
    const updates: { id: string; latitude: number; longitude: number }[] = []
    let foundCount = 0
    let notFoundCount = 0

    for (const c of companies as { id: string; name: string; note: string | null }[]) {
      if (abortRef.current) break

      const district = extractDistrict(c.note)
      const center = district ? BURSA_DISTRICTS[district] : null

      if (center) {
        const [lat, lon] = withOffset(center[0], center[1])
        updates.push({ id: c.id, latitude: lat, longitude: lon })
        foundCount++
      } else {
        // İlçe bulunamadı → Bursa merkezi kullan
        const [lat, lon] = withOffset(40.1885, 29.0610)
        updates.push({ id: c.id, latitude: lat, longitude: lon })
        notFoundCount++
      }
    }

    // 50'şer gruplar halinde DB'ye yaz
    const BATCH = 50
    for (let i = 0; i < updates.length; i += BATCH) {
      const batch = updates.slice(i, i + BATCH)
      await Promise.all(
        batch.map((u) =>
          supabase
            .from('companies')
            .update({ latitude: u.latitude, longitude: u.longitude })
            .eq('id', u.id)
        )
      )
    }

    setFound(foundCount)
    setNotFound(notFoundCount)
    setStatus('done')
  }

  return (
    <>
      <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
        <MapPin className="h-4 w-4" />
        Koordinatları Doldur
      </Button>

      <Modal
        open={open}
        onClose={() => {
          if (status !== 'running') {
            setOpen(false)
            setStatus('idle')
          }
        }}
        title="Firma Koordinatları — İlçe Bazlı Doldur"
      >
        {status === 'idle' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Her okul/firma için kayıtlı <strong>ilçe bilgisi</strong> kullanılarak
              koordinat atanır. Saniyeler içinde tüm firmalar haritada görünür.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
              ℹ️ Koordinatlar ilçe merkezi bazlıdır (~400m dağıtım ile).
              Bölge planlama için yeterli hassasiyettedir.
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="secondary" type="button" onClick={() => setOpen(false)}>
                İptal
              </Button>
              <Button onClick={handleStart}>
                <MapPin className="h-4 w-4" />
                Başlat
              </Button>
            </div>
          </div>
        )}

        {status === 'running' && (
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="w-10 h-10 border-4 border-brand border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-600">Koordinatlar yazılıyor...</p>
          </div>
        )}

        {status === 'done' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-2xl font-bold text-green-700">{found}</p>
                <p className="text-xs text-green-600 mt-0.5">İlçe Eşleşti</p>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-2xl font-bold text-amber-700">{notFound}</p>
                <p className="text-xs text-amber-600 mt-0.5">Bursa Merkezi Atandı</p>
              </div>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm font-semibold text-green-800">
                ✅ {total} firmanın koordinatı güncellendi!
              </p>
              <p className="text-sm text-green-700 mt-1">
                Bölge haritasına gidip konumunuzu alabilirsiniz.
              </p>
            </div>
            <div className="flex justify-end">
              <Button onClick={() => { setOpen(false); setStatus('idle') }}>
                Kapat
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}
