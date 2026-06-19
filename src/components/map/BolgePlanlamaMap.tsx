'use client'
import dynamic from 'next/dynamic'
import { useState, useMemo } from 'react'
import { useGPS } from '@/hooks/useGPS'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { Locate } from 'lucide-react'
import type { CompanyMarker } from './BolgePlanlamaInner'

const BolgePlanlamaInner = dynamic(() => import('./BolgePlanlamaInner'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center bg-gray-100 rounded-none" style={{ height: 'calc(100vh - 200px)' }}>
      <div className="text-center space-y-2">
        <Spinner size="md" />
        <p className="text-sm text-gray-500">Harita yükleniyor...</p>
      </div>
    </div>
  ),
})

// Haversine mesafe (metre) — sadece client tarafında kullanılır
function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

type Radius = 1 | 3 | 5 | 0  // 0 = tümü

interface Props {
  companies: CompanyMarker[]
}

export function BolgePlanlamaMap({ companies }: Props) {
  const { capturing, capture } = useGPS()
  const [userLat, setUserLat] = useState<number | null>(null)
  const [userLon, setUserLon] = useState<number | null>(null)
  const [gpsError, setGpsError] = useState<string | null>(null)
  const [radius, setRadius] = useState<Radius>(3)
  const [onlyUnvisited, setOnlyUnvisited] = useState(false)

  const handleGetGPS = async () => {
    setGpsError(null)
    const result = await capture()
    if (result.status === 'success') {
      setUserLat(result.latitude)
      setUserLon(result.longitude)
    } else {
      setGpsError(result.reason)
    }
  }

  // Firma listesini filtrele + mesafe ekle
  const filteredCompanies = useMemo<CompanyMarker[]>(() => {
    let list = companies

    // Yarıçap filtresi (GPS varsa)
    if (userLat && userLon && radius !== 0) {
      const maxMeters = radius * 1000
      list = list
        .map((c) => ({
          ...c,
          distanceMeters: haversineMeters(userLat, userLon, c.latitude, c.longitude),
        }))
        .filter((c) => (c.distanceMeters ?? Infinity) <= maxMeters)
    } else if (userLat && userLon) {
      list = list.map((c) => ({
        ...c,
        distanceMeters: haversineMeters(userLat, userLon, c.latitude, c.longitude),
      }))
    }

    // Sadece ziyaret edilmeyenler filtresi
    if (onlyUnvisited) {
      list = list.filter((c) => c.lastVisitDate === null)
    }

    return list
  }, [companies, userLat, userLon, radius, onlyUnvisited])

  const radiusMeters = radius !== 0 ? radius * 1000 : null
  const unvisitedCount = filteredCompanies.filter((c) => c.lastVisitDate === null).length
  const visitedCount   = filteredCompanies.filter((c) => c.lastVisitDate !== null).length

  return (
    <div className="flex flex-col h-full">
      {/* Kontrol Barı */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 space-y-3">
        {/* Satır 1: GPS butonu + sayaçlar */}
        <div className="flex items-center gap-3">
          <Button
            size="sm"
            onClick={handleGetGPS}
            disabled={capturing}
          >
            {capturing ? <Spinner size="sm" /> : <Locate className="h-4 w-4" />}
            {capturing ? 'Alınıyor...' : userLat ? 'Güncelle' : 'Konumumu Al'}
          </Button>

          {userLat && (
            <div className="flex gap-3 text-xs">
              <span className="text-red-500 font-medium">● {unvisitedCount} ziyaret edilmedi</span>
              <span className="text-green-600 font-medium">● {visitedCount} ziyaret edildi</span>
            </div>
          )}
        </div>

        {gpsError && (
          <p className="text-xs text-red-500">{gpsError}</p>
        )}

        {/* Satır 2: Yarıçap + Toggle */}
        <div className="flex items-center justify-between gap-3">
          {/* Yarıçap seçimi */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-gray-500 shrink-0">Yarıçap:</span>
            {([1, 3, 5, 0] as Radius[]).map((r) => (
              <button
                key={r}
                onClick={() => setRadius(r)}
                className={`px-2 py-1 rounded-md border font-medium transition-colors ${
                  radius === r
                    ? 'bg-brand text-white border-brand'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-brand'
                }`}
              >
                {r === 0 ? 'Tümü' : `${r}km`}
              </button>
            ))}
          </div>

          {/* Sadece ziyaret edilmeyenler toggle */}
          <button
            onClick={() => setOnlyUnvisited((v) => !v)}
            className={`text-xs px-2.5 py-1 rounded-md border font-medium transition-colors whitespace-nowrap ${
              onlyUnvisited
                ? 'bg-red-500 text-white border-red-500'
                : 'bg-white text-gray-600 border-gray-300'
            }`}
          >
            Sadece Gidilmeyenler
          </button>
        </div>
      </div>

      {/* Harita */}
      <div className="flex-1">
        <BolgePlanlamaInner
          companies={filteredCompanies}
          userLat={userLat}
          userLon={userLon}
          radiusMeters={radiusMeters}
          height="100%"
        />
      </div>
    </div>
  )
}
