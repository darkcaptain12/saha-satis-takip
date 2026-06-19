'use client'
import { useState } from 'react'
import { AdminSidebar } from '@/components/layout/AdminSidebar'
import { AdminHeader } from '@/components/layout/AdminHeader'
import { AdminBottomNav } from '@/components/layout/AdminBottomNav'
import { UpdateNoticeModal } from '@/components/ui/UpdateNoticeModal'
import { usePathname } from 'next/navigation'

const pageTitles: Record<string, string> = {
  '/admin/dashboard':   'Dashboard',
  '/admin/personeller': 'Personel Yönetimi',
  '/admin/firmalar':    'Firma Yönetimi',
  '/admin/ziyaretler':  'Tüm Ziyaretler',
  '/admin/harita':      'Harita Görünümü',
  '/admin/raporlar':    'Raporlar',
}

function getTitle(pathname: string): string {
  for (const [prefix, title] of Object.entries(pageTitles)) {
    if (pathname === prefix || pathname.startsWith(prefix + '/')) return title
  }
  return 'Admin Panel'
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="lg:pl-60 flex flex-col min-h-screen">
        <AdminHeader
          title={getTitle(pathname)}
          onMenuClick={() => setSidebarOpen(true)}
        />
        {/* pb-20 mobilde bottom nav için alan bırakır */}
        <main className="flex-1 p-4 pb-24 lg:p-6 lg:pb-6">
          {children}
        </main>
      </div>
      <AdminBottomNav onMenuClick={() => setSidebarOpen(true)} />
      <UpdateNoticeModal />
    </div>
  )
}
