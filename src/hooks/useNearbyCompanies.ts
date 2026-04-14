import type { Company } from '@/types'

// Haversine mesafe (metre)
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

// Nominatim reverse geocode → anlamlı anahtar kelimeler
async function getLocationKeywords(lat: number, lon: number): Promise<string[]> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=tr`,
      { headers: { 'User-Agent': 'SahaSatisTakip/1.0' } }
    )
    if (!res.ok) return []
    const data = await res.json()
    const addr = data.address ?? {}

    // Türkiye adres yapısına uygun alanlar
    const candidates = [
      addr.neighbourhood,     // Mahalle
      addr.suburb,            // Semt
      addr.quarter,           // Çeyrek
      addr.city_district,     // İlçe (büyük şehir)
      addr.town,              // Kasaba
      addr.village,           // Köy
      addr.county,            // İlçe (küçük şehir)
      addr.road,              // Cadde/Sokak
    ]
    return candidates.filter(Boolean).map((k: string) => k.toUpperCase())
  } catch {
    return []
  }
}

export interface NearbyResult {
  company: Company
  distance: number | null  // metre, null = Nominatim ile eşleşti
  matchType: 'gps' | 'address'
}

export async function findNearbyCompanies(
  lat: number,
  lon: number,
  companies: Company[],
  maxMeters = 500
): Promise<NearbyResult[]> {
  const results: NearbyResult[] = []

  // 1. Koordinatlı firmalar → Haversine
  const withCoords = companies.filter((c) => c.latitude != null && c.longitude != null)
  for (const c of withCoords) {
    const dist = haversineMeters(lat, lon, c.latitude!, c.longitude!)
    if (dist <= maxMeters) {
      results.push({ company: c, distance: dist, matchType: 'gps' })
    }
  }

  // GPS eşleşmesi yeterliyse (≥3 sonuç) Nominatim'e gidme
  if (results.length >= 3) {
    return results.sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0)).slice(0, 5)
  }

  // 2. Koordinatsız firmalar → Nominatim → adres metin araması
  const keywords = await getLocationKeywords(lat, lon)
  if (keywords.length > 0) {
    const withoutCoords = companies.filter((c) => c.latitude == null && c.address)
    for (const c of withoutCoords) {
      const addr = c.address!.toUpperCase()
      const matched = keywords.some((kw) => addr.includes(kw))
      if (matched && !results.find((r) => r.company.id === c.id)) {
        results.push({ company: c, distance: null, matchType: 'address' })
      }
    }
  }

  // Sırala: önce GPS (mesafeye göre), sonra adres
  return results
    .sort((a, b) => {
      if (a.matchType === 'gps' && b.matchType === 'gps') return (a.distance ?? 0) - (b.distance ?? 0)
      if (a.matchType === 'gps') return -1
      if (b.matchType === 'gps') return 1
      return 0
    })
    .slice(0, 5)
}
