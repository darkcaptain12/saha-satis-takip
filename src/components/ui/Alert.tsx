import { cn } from '@/lib/utils'
import { AlertCircle, CheckCircle, Info, XCircle } from 'lucide-react'

type AlertVariant = 'info' | 'success' | 'warning' | 'error'

interface AlertProps {
  variant?: AlertVariant
  title?: string
  children: React.ReactNode
  className?: string
}

const styles: Record<AlertVariant, { wrapper: string; icon: React.ReactNode }> = {
  info:    { wrapper: 'bg-blue-50 border-blue-200 text-blue-800',   icon: <Info className="h-4 w-4 text-blue-500 shrink-0" /> },
  success: { wrapper: 'bg-green-50 border-green-200 text-green-800', icon: <CheckCircle className="h-4 w-4 text-green-500 shrink-0" /> },
  warning: { wrapper: 'bg-yellow-50 border-yellow-200 text-yellow-800', icon: <AlertCircle className="h-4 w-4 text-yellow-500 shrink-0" /> },
  error:   { wrapper: 'bg-red-50 border-red-200 text-red-800',      icon: <XCircle className="h-4 w-4 text-red-500 shrink-0" /> },
}

export function Alert({ variant = 'info', title, children, className }: AlertProps) {
  const s = styles[variant]
  return (
    <div className={cn('flex gap-3 rounded-lg border p-4 text-sm', s.wrapper, className)}>
      <div className="mt-0.5">{s.icon}</div>
      <div>
        {title && <p className="font-semibold mb-0.5">{title}</p>}
        <div>{children}</div>
      </div>
    </div>
  )
}
