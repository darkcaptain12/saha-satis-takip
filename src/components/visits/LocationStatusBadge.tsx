import { Badge } from '@/components/ui/Badge'
import { MapPin, MapPinOff, MinusCircle, PenLine } from 'lucide-react'
import type { LocationStatus } from '@/types'

interface LocationStatusBadgeProps {
  status: LocationStatus
}

export function LocationStatusBadge({ status }: LocationStatusBadgeProps) {
  if (status === 'success') {
    return (
      <Badge variant="green">
        <MapPin className="h-3 w-3" />
        Konum Alındı
      </Badge>
    )
  }
  if (status === 'failed') {
    return (
      <Badge variant="red">
        <MapPinOff className="h-3 w-3" />
        Konum Alınamadı
      </Badge>
    )
  }
  if (status === 'manual') {
    return (
      <Badge variant="blue">
        <PenLine className="h-3 w-3" />
        Manuel Adres
      </Badge>
    )
  }
  return (
    <Badge variant="gray">
      <MinusCircle className="h-3 w-3" />
      Konum Yok
    </Badge>
  )
}
