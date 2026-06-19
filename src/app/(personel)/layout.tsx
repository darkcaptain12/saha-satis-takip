'use client'
import { PersonelHeader } from '@/components/layout/PersonelHeader'
import { PersonelBottomNav } from '@/components/layout/PersonelBottomNav'
import { UpdateNoticeModal } from '@/components/ui/UpdateNoticeModal'

export default function PersonelLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <PersonelHeader />
      <main className="flex-1 p-4 pb-24">
        {children}
      </main>
      <PersonelBottomNav />
      <UpdateNoticeModal />
    </div>
  )
}
