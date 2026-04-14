'use client'
import { useState, useRef } from 'react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { createClient } from '@/lib/supabase/client'
import { MapPin } from 'lucide-react'

type GeoStatus = 'idle' | 'running' | 'stopped' | 'done'

export function AdminGeocodeButton() {
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState<GeoStatus>('idle')
  const [total, setTotal] = useState(0)
  const [processed, setProcessed] = useState(0)
  const [found, setFound] = useState(0)
  const [notFound, setNotFound] = useState(0)
  const [currentName, setCurrentName] = useState('')
  const abortRef = useRef(false)

  const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

  async function geocodeOne(
    address: string | null,
    name: string
  ): Promise<{ lat: number; lon: number } | null> {
    const queries: string[] = []
    if (address) queries.push(`${address}, Bursa, Türkiye`)
    queries.push(`${name}, Bursa, Türkiye`)

    for (const q of queries) {
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=tr&q=${encodeURIComponent(q)}`
        const res = await fetch(url, {
          headers: { 'User-Agent': 'SahaSatisTakip/1.0 (contact@baski.com)' },
        })
        if (!res.ok) continue
        const data = await res.json()
        if (Array.isArray(data) && data.length > 0) {
          return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) }
        }
      } catch {
        // ignore, try next query
      }
      // rate-limit gap between retries
      await delay(1300)
    }
    return null
  }

  const handleStart = async () => {
    const supabase = createClient()
    abortRef.current = false
    setProcessed(0)
    setFound(0)
    setNotFound(0)
    setCurrentName('')
    setStatus('running')

    const { data: companies, error } = await supabase
      .from('companies')
      .select('id, name, address')
      .is('latitude', null)
      .order('name')

    if (error || !companies || companies.length === 0) {
      setStatus('done')
      return
    }

    setTotal(companies.length)

    for (const company of companies as { id: string; name: string; address: string | null }[]) {
      if (abortRef.current) {
        setStatus('stopped')
        return
      }

      setCurrentName(company.name)

      const coords = await geocodeOne(company.address, company.name)

      if (coords) {
        await supabase
          .from('companies')
          .update({ latitude: coords.lat, longitude: coords.lon })
          .eq('id', company.id)
        setFound((f) => f + 1)
      } else {
        setNotFound((n) => n + 1)
      }

      setProcessed((p) => p + 1)
      // Nominatim rate limit: 1 req/sec — keep 1.3 s gap
      await delay(1300)
    }

    setStatus('done')
  }

  const progressPct = total > 0 ? Math.round((processed / total) * 100) : 0

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
        title="Firma Koordinatları — Otomatik Doldur"
      >
        {status === 'idle' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Koordinatı (enlem/boylam) olmayan firmalar için adres bilgisinden otomatik
              koordinat bulunur ve veritabanına kaydedilir. Böylece GPS yakın firma önerisi
              daha doğru çalışır.
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
              ⚠️ Her firma için ~1.3 saniye bekleniyor (Nominatim hız limiti).
              İşlem sırasında bu sekmeyi kapatmayın.
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

        {status !== 'idle' && (
          <div className="space-y-4">
            {/* Progress bar */}
            <div>
              <div className="flex justify-between text-sm text-gray-600 mb-1.5">
                <span>{processed} / {total} işlendi</span>
                <span>%{progressPct}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5">
                <div
                  className="bg-brand h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-2xl font-bold text-green-700">{found}</p>
                <p className="text-xs text-green-600 mt-0.5">Koordinat Bulundu</p>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-2xl font-bold text-red-700">{notFound}</p>
                <p className="text-xs text-red-600 mt-0.5">Bulunamadı</p>
              </div>
            </div>

            {/* Current item */}
            {status === 'running' && currentName && (
              <p className="text-sm text-gray-400 truncate">
                <span className="inline-block animate-pulse mr-1">⏳</span>
                {currentName}
              </p>
            )}

            {/* Result banners */}
            {status === 'done' && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-sm font-semibold text-green-800">✅ İşlem tamamlandı!</p>
                <p className="text-sm text-green-700 mt-1">
                  {found} firmaya koordinat eklendi.
                  {notFound > 0 && ` ${notFound} firma için adres bulunamadı.`}
                </p>
              </div>
            )}

            {status === 'stopped' && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-sm text-amber-800">
                  ⏸️ Durduruldu. Kalan firmalar koordinatsız bırakıldı.
                  İstediğinizde tekrar başlatabilirsiniz.
                </p>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-3 justify-end">
              {status === 'running' && (
                <Button
                  variant="danger"
                  type="button"
                  onClick={() => { abortRef.current = true }}
                >
                  Durdur
                </Button>
              )}
              {(status === 'done' || status === 'stopped') && (
                <Button
                  onClick={() => {
                    setOpen(false)
                    setStatus('idle')
                  }}
                >
                  Kapat
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}
