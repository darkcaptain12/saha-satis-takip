'use client'
import dynamic from 'next/dynamic'
import { Spinner } from '@/components/ui/Spinner'
import type { Visit } from '@/types'

const VisitMapInner = dynamic(() => import('./VisitMapInner'), {
  ssr: false,
  loading: () => (
    <div
      style={{ height: '400px' }}
      className="flex items-center justify-center bg-gray-100 rounded-lg"
    >
      <div className="text-center space-y-2">
        <Spinner size="md" />
        <p className="text-sm text-gray-500">Harita yükleniyor...</p>
      </div>
    </div>
  ),
})

interface VisitMapProps {
  visits: Visit[]
  height?: string
  singleVisit?: boolean
}

export function VisitMap({ visits, height = '400px', singleVisit }: VisitMapProps) {
  const locationVisits = visits.filter(
    (v) => v.location_status === 'success' && v.latitude != null && v.longitude != null
  )

  if (locationVisits.length === 0) {
    return (
      <div
        style={{ height }}
        className="flex items-center justify-center bg-gray-50 rounded-lg"
      >
        <p className="text-sm text-gray-400">Gösterilecek konum bilgisi yok.</p>
      </div>
    )
  }

  return <VisitMapInner visits={locationVisits} height={height} singleVisit={singleVisit} />
}
