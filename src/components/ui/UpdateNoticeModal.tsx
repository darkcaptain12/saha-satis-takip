'use client'
import { useEffect, useState } from 'react'
import { X } from 'lucide-react'

const STORAGE_KEY = 'asli_update_notice_v1'

export function UpdateNoticeModal() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      setOpen(true)
    }
  }, [])

  useEffect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const close = () => {
    localStorage.setItem(STORAGE_KEY, 'seen')
    setOpen(false)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Blur overlay */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={close}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="update-notice-title"
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-gray-100">
          <h2
            id="update-notice-title"
            className="text-base font-semibold text-gray-900 leading-snug pr-2"
          >
            🚨 Aslı Abla&apos;ya Özel Duyuru 🚨
          </h2>
          <button
            onClick={close}
            className="shrink-0 rounded-lg p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="Kapat"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-3 text-sm text-gray-700 leading-relaxed">
          <p>
            Sistem kısa süreli bir bakım kampından başarıyla döndü.
          </p>
          <p>
            Daha önce yavaş hareket eden ekranlar gerekli motivasyon konuşmalarını
            aldı, filtreler hızlandırıldı ve bazı tembel satırlar görevden alındı. 😄
          </p>
          <p className="font-medium text-gray-900">Kısacası artık sistem:</p>
          <ul className="space-y-1.5 pl-1">
            <li>✅ Daha hızlı</li>
            <li>✅ Daha akıcı</li>
            <li>✅ Daha az huysuz</li>
          </ul>
          <p>Herhangi bir gariplik görürsen bize haber ver. 😉</p>
          <p className="font-medium text-gray-900">
            Bol müşterili, bol siparişli günler! 🚀
          </p>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6">
          <button
            onClick={close}
            className="w-full py-2.5 bg-brand text-white rounded-xl font-medium text-sm hover:bg-brand/90 active:scale-[0.98] transition-all"
          >
            Anladım, haydi başlayalım! 🎯
          </button>
        </div>
      </div>
    </div>
  )
}
