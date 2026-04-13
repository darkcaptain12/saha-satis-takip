'use client'
import { Printer } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

export function PersonelHeader() {
  const { profile } = useAuth()

  return (
    <header className="sticky top-0 z-20 bg-brand px-4 h-14 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="bg-white/10 rounded-lg p-1">
          <Printer className="h-4 w-4 text-white" />
        </div>
        <span className="text-white font-semibold text-sm">Saha Satış</span>
      </div>
      {profile && (
        <span className="text-white/80 text-xs">
          Merhaba, {profile.name.split(' ')[0]}
        </span>
      )}
    </header>
  )
}
