import { Badge } from '@/components/ui/Badge'
import { CheckCircle, FileText, Clock, ShoppingCart } from 'lucide-react'
import type { VisitStatus } from '@/types'

interface VisitStatusBadgeProps {
  status: VisitStatus | null
}

const config: Record<VisitStatus, { label: string; variant: 'green' | 'blue' | 'yellow' | 'gray'; Icon: React.ElementType }> = {
  gorusuldu:      { label: 'Görüşüldü',      variant: 'green',  Icon: CheckCircle },
  teklif_verildi: { label: 'Teklif Verildi', variant: 'blue',   Icon: FileText },
  takip_gerekli:  { label: 'Takip Gerekli',  variant: 'yellow', Icon: Clock },
  siparis_alindi: { label: 'Sipariş Alındı', variant: 'gray',   Icon: ShoppingCart },
}

export function VisitStatusBadge({ status }: VisitStatusBadgeProps) {
  if (!status) return null
  const { label, variant, Icon } = config[status]
  return (
    <Badge variant={variant}>
      <Icon className="h-3 w-3" />
      {label}
    </Badge>
  )
}

export const VISIT_STATUS_OPTIONS: { value: VisitStatus; label: string }[] = [
  { value: 'gorusuldu',      label: 'Görüşüldü' },
  { value: 'teklif_verildi', label: 'Teklif Verildi' },
  { value: 'takip_gerekli',  label: 'Takip Gerekli' },
  { value: 'siparis_alindi', label: 'Sipariş Alındı' },
]
