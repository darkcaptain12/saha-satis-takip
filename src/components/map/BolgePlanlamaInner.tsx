'use client'
import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Leaflet Next.js/Webpack icon düzeltmesi
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: '/leaflet/marker-icon-2x.png',
  iconUrl: '/leaflet/marker-icon.png',
  shadowUrl: '/leaflet/marker-shadow.png',
})

// Renkli pin marker oluşturucu
function coloredPin(color: string): L.DivIcon {
  return L.divIcon({
    className: '',
    html: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="36" viewBox="0 0 24 36">
      <path d="M12 0C5.373 0 0 5.373 0 12c0 9 12 24 12 24S24 21 24 12C24 5.373 18.627 0 12 0z"
        fill="${color}" stroke="white" stroke-width="1.5"/>
      <circle cx="12" cy="12" r="5" fill="white" opacity="0.9"/>
    </svg>`,
    iconSize: [24, 36],
    iconAnchor: [12, 36],
    popupAnchor: [0, -36],
  })
}

// Kullanıcı konumu için pulsing mavi daire
function userLocationIcon(): L.DivIcon {
  return L.divIcon({
    className: '',
    html: `<div style="
      width:20px;height:20px;
      background:rgba(59,130,246,0.9);
      border:3px solid white;
      border-radius:50%;
      box-shadow:0 0 0 6px rgba(59,130,246,0.3);
      animation:pulse 2s infinite;
    "></div>
    <style>
      @keyframes pulse {
        0%{box-shadow:0 0 0 0 rgba(59,130,246,0.4)}
        70%{box-shadow:0 0 0 12px rgba(59,130,246,0)}
        100%{box-shadow:0 0 0 0 rgba(59,130,246,0)}
      }
    </style>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -14],
  })
}

export interface CompanyMarker {
  id: string
  name: string
  address: string | null
  latitude: number
  longitude: number
  lastVisitDate: string | null   // null = hiç ziyaret edilmedi
  distanceMeters: number | null
}

interface Props {
  companies: CompanyMarker[]
  userLat: number | null
  userLon: number | null
  radiusMeters: number | null   // null = tüm Türkiye/sınırsız
  height: string
}

// GPS konumuna haritayı kaydır
function MapFly({ lat, lon }: { lat: number; lon: number }) {
  const map = useMap()
  useEffect(() => {
    map.flyTo([lat, lon], 13, { duration: 1.2 })
  }, [lat, lon, map])
  return null
}

const UNVISITED_PIN = coloredPin('#ef4444')   // kırmızı
const VISITED_PIN   = coloredPin('#22c55e')   // yeşil

function daysSince(dateStr: string): number {
  const diff = Date.now() - new Date(dateStr).getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

export default function BolgePlanlamaInner({ companies, userLat, userLon, radiusMeters, height }: Props) {
  // Bursa merkezi varsayılan
  const defaultCenter: [number, number] = [40.1885, 29.0610]
  const center: [number, number] = userLat && userLon ? [userLat, userLon] : defaultCenter

  return (
    <MapContainer
      center={center}
      zoom={userLat ? 13 : 11}
      style={{ height, width: '100%' }}
      className="z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* GPS konumu alındıysa haritayı kaydır */}
      {userLat && userLon && <MapFly lat={userLat} lon={userLon} />}

      {/* Kullanıcı konum markeri */}
      {userLat && userLon && (
        <Marker position={[userLat, userLon]} icon={userLocationIcon()}>
          <Popup>
            <p className="text-sm font-semibold text-blue-600">📍 Konumunuz</p>
          </Popup>
        </Marker>
      )}

      {/* Yarıçap dairesi */}
      {userLat && userLon && radiusMeters && (
        <Circle
          center={[userLat, userLon]}
          radius={radiusMeters}
          pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.05, weight: 1.5 }}
        />
      )}

      {/* Firma markerleri */}
      {companies.map((c) => {
        const visited = c.lastVisitDate !== null
        const icon = visited ? VISITED_PIN : UNVISITED_PIN
        const days = visited ? daysSince(c.lastVisitDate!) : null

        return (
          <Marker key={c.id} position={[c.latitude, c.longitude]} icon={icon}>
            <Popup minWidth={200}>
              <div className="text-sm">
                <p className="font-semibold text-gray-900 mb-1 leading-tight">{c.name}</p>
                {c.address && (
                  <p className="text-gray-500 text-xs mb-2 leading-snug">{c.address}</p>
                )}
                {c.distanceMeters != null && (
                  <p className="text-xs text-blue-600 mb-1">
                    📏 {c.distanceMeters < 1000
                      ? `${Math.round(c.distanceMeters)} m`
                      : `${(c.distanceMeters / 1000).toFixed(1)} km`} uzaklıkta
                  </p>
                )}
                <p className={`text-xs font-medium mb-2 ${visited ? 'text-green-600' : 'text-red-500'}`}>
                  {visited ? `✅ Son ziyaret: ${days} gün önce` : '❌ Hiç ziyaret edilmedi'}
                </p>
                <a
                  href={`/personel/yeni-ziyaret?company_id=${c.id}`}
                  className="inline-block bg-brand text-white text-xs px-3 py-1.5 rounded-md font-medium hover:opacity-90"
                >
                  Ziyareti Kaydet →
                </a>
              </div>
            </Popup>
          </Marker>
        )
      })}
    </MapContainer>
  )
}
