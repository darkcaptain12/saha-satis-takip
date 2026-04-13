'use client'
import { Printer } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import Image from 'next/image'

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
        <div className="flex items-center gap-2">
          <span className="text-white/80 text-xs">
            Merhaba, {profile.name.split(' ')[0]}
          </span>
          {profile.avatar_url ? (
            <div className="relative w-7 h-7 rounded-full overflow-hidden ring-2 ring-white/30">
              <Image src={profile.avatar_url} alt={profile.name} fill className="object-cover" unoptimized />
            </div>
          ) : (
            <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-white text-xs font-semibold">
              {profile.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      )}
    </header>
  )
}
