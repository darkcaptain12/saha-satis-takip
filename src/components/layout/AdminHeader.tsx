'use client'
import { useState, useEffect, useRef } from 'react'
import { Menu, Search, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatDate } from '@/lib/utils'

interface AdminHeaderProps {
  title: string
  onMenuClick: () => void
}

interface SearchResult {
  type: 'visit' | 'company' | 'staff'
  id: string
  label: string
  sub: string
  href: string
}

export function AdminHeader({ title, onMenuClick }: AdminHeaderProps) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [open, setOpen] = useState(false)
  const [searchBarOpen, setSearchBarOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Dışarı tıklayınca kapat
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults([])
      setOpen(false)
      return
    }

    const timer = setTimeout(async () => {
      setSearching(true)
      const supabase = createClient()
      const q = query.trim()

      const [{ data: visits }, { data: companies }, { data: staff }] = await Promise.all([
        supabase
          .from('visits')
          .select('id, company_name_snapshot, visit_date, note, profiles(name)')
          .or(`company_name_snapshot.ilike.%${q}%,note.ilike.%${q}%`)
          .order('visit_date', { ascending: false })
          .limit(5),
        supabase
          .from('companies')
          .select('id, name, address')
          .ilike('name', `%${q}%`)
          .limit(4),
        supabase
          .from('profiles')
          .select('id, name, email')
          .eq('role', 'personel')
          .ilike('name', `%${q}%`)
          .limit(3),
      ])

      const res: SearchResult[] = []

      ;(staff ?? []).forEach((s: { id: string; name: string; email: string }) => {
        res.push({ type: 'staff', id: s.id, label: s.name, sub: s.email, href: `/admin/personeller/${s.id}` })
      })
      ;(companies ?? []).forEach((c: { id: string; name: string; address: string | null }) => {
        res.push({ type: 'company', id: c.id, label: c.name, sub: c.address ?? 'Firma', href: `/admin/firmalar/${c.id}` })
      })
      ;(visits ?? []).forEach((v: { id: string; company_name_snapshot: string; visit_date: string; profiles: { name: string } | null }) => {
        res.push({
          type: 'visit',
          id: v.id,
          label: v.company_name_snapshot,
          sub: `${formatDate(v.visit_date)} · ${(v.profiles as { name: string } | null)?.name ?? ''}`,
          href: `/admin/ziyaretler/${v.id}`,
        })
      })

      setResults(res)
      setOpen(res.length > 0)
      setSearching(false)
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  const handleSelect = (href: string) => {
    router.push(href)
    setQuery('')
    setResults([])
    setOpen(false)
    setSearchBarOpen(false)
  }

  const typeLabel: Record<SearchResult['type'], string> = {
    visit: 'Ziyaret',
    company: 'Firma',
    staff: 'Personel',
  }

  const typeColor: Record<SearchResult['type'], string> = {
    visit: 'bg-blue-100 text-blue-700',
    company: 'bg-purple-100 text-purple-700',
    staff: 'bg-green-100 text-green-700',
  }

  return (
    <header className="sticky top-0 z-20 bg-white border-b border-gray-200 px-4 lg:px-6 h-14 flex items-center gap-3">
      {/* Hamburger */}
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Başlık — mobilde arama açıksa gizle */}
      {!searchBarOpen && (
        <h1 className="text-base font-semibold text-gray-900 flex-1 lg:flex-none truncate">{title}</h1>
      )}

      {/* Arama — desktop her zaman, mobil toggle */}
      <div
        ref={containerRef}
        className={`relative ${searchBarOpen ? 'flex-1' : 'hidden lg:block'}`}
      >
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Firma, ziyaret veya personel ara..."
            className="w-full lg:w-72 pl-9 pr-8 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand focus:bg-white transition-all"
          />
          {query && (
            <button
              onClick={() => { setQuery(''); setResults([]); setOpen(false) }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Sonuçlar dropdown */}
        {open && results.length > 0 && (
          <div className="absolute top-full mt-1 left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden z-50 min-w-[300px]">
            {searching ? (
              <p className="text-xs text-gray-400 text-center py-4">Aranıyor...</p>
            ) : (
              results.map((r) => (
                <button
                  key={`${r.type}-${r.id}`}
                  onMouseDown={() => handleSelect(r.href)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-left transition-colors"
                >
                  <span className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${typeColor[r.type]}`}>
                    {typeLabel[r.type]}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{r.label}</p>
                    <p className="text-xs text-gray-400 truncate">{r.sub}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Mobil arama toggle */}
      <div className="lg:hidden ml-auto flex items-center gap-1">
        {searchBarOpen ? (
          <button
            onClick={() => { setSearchBarOpen(false); setQuery(''); setResults([]); setOpen(false) }}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        ) : (
          <button
            onClick={() => { setSearchBarOpen(true); setTimeout(() => inputRef.current?.focus(), 50) }}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100"
          >
            <Search className="h-5 w-5" />
          </button>
        )}
      </div>
    </header>
  )
}
