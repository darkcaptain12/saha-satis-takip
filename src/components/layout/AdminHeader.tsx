'use client'
import { Menu } from 'lucide-react'

interface AdminHeaderProps {
  title: string
  onMenuClick: () => void
}

export function AdminHeader({ title, onMenuClick }: AdminHeaderProps) {
  return (
    <header className="sticky top-0 z-20 bg-white border-b border-gray-200 px-4 lg:px-6 h-14 flex items-center gap-3">
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100"
      >
        <Menu className="h-5 w-5" />
      </button>
      <h1 className="text-base font-semibold text-gray-900">{title}</h1>
    </header>
  )
}
