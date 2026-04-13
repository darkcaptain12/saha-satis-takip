'use client'
import { useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { formatDate, formatTime } from '@/lib/utils'
import type { Visit } from '@/types'

// Leaflet'in Next.js/Webpack ile ikon sorunu düzeltmesi
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: '/leaflet/marker-icon-2x.png',
  iconUrl: '/leaflet/marker-icon.png',
  shadowUrl: '/leaflet/marker-shadow.png',
})

interface VisitMapInnerProps {
  visits: Visit[]
  height: string
  singleVisit?: boolean
}

// visits prop'u yalnızca location_status=success ve koordinatlı kayıtlar içerir
export default function VisitMapInner({ visits, height, singleVisit }: VisitMapInnerProps) {
  const center = useMemo<[number, number]>(() => {
    if (visits.length === 0) return [41.0082, 28.9784] // İstanbul
    const lat = visits.reduce((s, v) => s + (v.latitude ?? 0), 0) / visits.length
    const lng = visits.reduce((s, v) => s + (v.longitude ?? 0), 0) / visits.length
    return [lat, lng]
  }, [visits])

  const zoom = singleVisit ? 15 : 11

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      style={{ height, width: '100%' }}
      className="rounded-lg z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {visits.map((v) => (
        <Marker
          key={v.id}
          position={[v.latitude as number, v.longitude as number]}
        >
          <Popup>
            <div className="text-sm min-w-[180px]">
              <p className="font-semibold text-gray-900 mb-1">{v.company_name_snapshot}</p>
              <p className="text-gray-500 text-xs">
                {formatDate(v.visit_date)} · {formatTime(v.visit_time)}
              </p>
              {v.accuracy && (
                <p className="text-gray-400 text-xs mt-0.5">±{v.accuracy.toFixed(0)}m doğruluk</p>
              )}
              {v.note && (
                <p className="text-gray-600 text-xs mt-2 border-t border-gray-100 pt-2 line-clamp-3">
                  {v.note}
                </p>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
