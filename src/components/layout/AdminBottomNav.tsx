'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, MapPin, Map, BarChart3, Menu } from 'lucide-react'
import { cn } from '@/lib/utils'

const mainItems = [
  { href: '/admin/dashboard',   label: 'Dashboard',  icon: LayoutDashboard },
  { href: '/admin/ziyaretler',  label: 'Ziyaretler', icon: MapPin },
  { href: '/admin/harita',      label: 'Harita',     icon: Map },
  { href: '/admin/raporlar',    label: 'Raporlar',   icon: BarChart3 },
]

interface AdminBottomNavProps {
  onMenuClick: () => void
}

export function AdminBottomNav({ onMenuClick }: AdminBottomNavProps) {
  const pathname = usePathname()

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200 flex items-center safe-area-inset-bottom">
      {mainItems.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(href + '/')
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex-1 flex flex-col items-center gap-0.5 py-2.5 text-xs font-medium transition-colors',
              active ? 'text-brand' : 'text-gray-400 hover:text-gray-600'
            )}
          >
            <Icon className={cn('h-5 w-5', active && 'text-brand')} />
            {label}
          </Link>
        )
      })}
      {/* Diğer menüler için hamburger */}
      <button
        onClick={onMenuClick}
        className="flex-1 flex flex-col items-center gap-0.5 py-2.5 text-xs font-medium text-gray-400 hover:text-gray-600 transition-colors"
      >
        <Menu className="h-5 w-5" />
        Menü
      </button>
    </nav>
  )
}
