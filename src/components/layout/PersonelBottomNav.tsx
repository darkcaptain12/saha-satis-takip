'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, PlusCircle, ClipboardList, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/personel/dashboard',    label: 'Ana Sayfa',  icon: Home },
  { href: '/personel/yeni-ziyaret', label: 'Yeni',       icon: PlusCircle },
  { href: '/personel/ziyaretlerim', label: 'Ziyaretler', icon: ClipboardList },
  { href: '/personel/profil',       label: 'Profil',     icon: User },
]

export function PersonelBottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200 pb-safe">
      <div className="flex">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex-1 flex flex-col items-center justify-center py-2.5 gap-1 text-xs font-medium transition-colors',
                active ? 'text-brand' : 'text-gray-500'
              )}
            >
              <Icon className={cn('h-5 w-5', active && 'text-brand')} />
              <span>{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
