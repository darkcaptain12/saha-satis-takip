'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import * as XLSX from 'xlsx'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { Alert } from '@/components/ui/Alert'
import { createClient } from '@/lib/supabase/client'
import { FileSpreadsheet, Upload, CheckCircle } from 'lucide-react'

type Step = 'upload' | 'map' | 'importing' | 'done'

interface ColMap {
  name: string
  address: string
  phone: string
  note: string
  latitude: string
  longitude: string
}

export function AdminExcelImport() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<Step>('upload')
  const [columns, setColumns] = useState<string[]>([])
  const [preview, setPreview] = useState<Record<string, string>[]>([])
  const [allRows, setAllRows] = useState<Record<string, string>[]>([])
  const [colMap, setColMap] = useState<ColMap>({ name: '', address: '', phone: '', note: '', latitude: '', longitude: '' })
  const [result, setResult] = useState({ added: 0, skipped: 0 })
  const [error, setError] = useState<string | null>(null)

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)

    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const wb = XLSX.read(ev.target?.result, { type: 'binary' })
        const ws = wb.Sheets[wb.SheetNames[0]]
        const rows = XLSX.utils.sheet_to_json<Record<string, string>>(ws, { defval: '' })
        if (!rows.length) { setError('Dosyada veri bulunamadı.'); return }

        const cols = Object.keys(rows[0])
        setColumns(cols)
        setAllRows(rows)
        setPreview(rows.slice(0, 3))

        // Akıllı otomatik eşleştirme
        const find = (...keywords: string[]) =>
          cols.find((c) => keywords.some((k) => c.toLowerCase().includes(k.toLowerCase()))) ?? ''

        setColMap({
          name:      find('kurum adı', 'ad', 'name', 'okul'),
          address:   find('adres', 'address'),
          phone:     find('telefon', 'phone', 'tel'),
          note:      find('tür', 'type', 'kategori', 'ilçe', 'not'),
          latitude:  find('lat', 'enlem'),
          longitude: find('lon', 'lng', 'boylam'),
        })

        setStep('map')
      } catch {
        setError('Dosya okunamadı. Lütfen geçerli bir Excel (.xlsx) veya CSV dosyası seçin.')
      }
    }
    reader.readAsBinaryString(file)
  }

  const handleImport = async () => {
    if (!colMap.name) { setError('Firma Adı sütununu seçin.'); return }
    setError(null)
    setStep('importing')

    // Mevcut firma adlarını çek (duplicate kontrolü)
    const supabase = createClient()
    const { data: existing } = await supabase.from('companies').select('name')
    const existingNames = new Set((existing ?? []).map((r: { name: string }) => r.name.trim().toUpperCase()))

    const toInsert = allRows
      .map((row) => ({
        name:      (row[colMap.name] ?? '').trim(),
        address:   colMap.address ? (row[colMap.address] ?? '').trim() || null : null,
        phone:     colMap.phone   ? (row[colMap.phone]   ?? '').trim() || null : null,
        note:      colMap.note    ? (row[colMap.note]    ?? '').trim() || null : null,
        latitude:  colMap.latitude  ? parseFloat(row[colMap.latitude]  ?? '') || null : null,
        longitude: colMap.longitude ? parseFloat(row[colMap.longitude] ?? '') || null : null,
      }))
      .filter((r) => r.name.length > 0)

    const newRows = toInsert.filter((r) => !existingNames.has(r.name.toUpperCase()))
    const skipped = toInsert.length - newRows.length

    let added = 0
    // 50'şer batch ile yükle
    for (let i = 0; i < newRows.length; i += 50) {
      const batch = newRows.slice(i, i + 50)
      const { error: err } = await supabase.from('companies').insert(batch)
      if (err) { setError('Yükleme hatası: ' + err.message); setStep('map'); return }
      added += batch.length
    }

    setResult({ added, skipped })
    setStep('done')
    router.refresh()
  }

  const handleClose = () => {
    setOpen(false)
    setStep('upload')
    setColumns([])
    setPreview([])
    setAllRows([])
    setError(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <>
      <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
        <FileSpreadsheet className="h-4 w-4" />
        Excel&apos;den Aktar
      </Button>

      <Modal open={open} onClose={handleClose} title="Excel&apos;den Firma Aktarma" size="lg">
        {error && <Alert variant="error" className="mb-4">{error}</Alert>}

        {/* ADIM 1: Dosya Yükle */}
        {step === 'upload' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Excel (.xlsx) veya CSV dosyasını seçin. Firma adı, adres, telefon kolonları otomatik eşleştirilir.
            </p>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="w-full border-2 border-dashed border-gray-200 rounded-xl py-10 flex flex-col items-center gap-3 text-gray-400 hover:border-brand hover:text-brand transition-colors"
            >
              <Upload className="h-8 w-8" />
              <span className="text-sm font-medium">Dosya Seç</span>
              <span className="text-xs">.xlsx, .xls veya .csv</span>
            </button>
            <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFile} />
          </div>
        )}

        {/* ADIM 2: Sütun Eşleştir */}
        {step === 'map' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              <strong>{allRows.length}</strong> satır bulundu. Sütunları eşleştirin:
            </p>

            <div className="grid grid-cols-2 gap-3">
              {([
                { key: 'name',      label: 'Firma / Okul Adı *', required: true },
                { key: 'address',   label: 'Adres' },
                { key: 'phone',     label: 'Telefon' },
                { key: 'note',      label: 'Not / Tür / İlçe' },
                { key: 'latitude',  label: 'Enlem (opsiyonel)' },
                { key: 'longitude', label: 'Boylam (opsiyonel)' },
              ] as { key: keyof ColMap; label: string; required?: boolean }[]).map(({ key, label }) => (
                <Select
                  key={key}
                  label={label}
                  placeholder="— Seç —"
                  value={colMap[key]}
                  onChange={(e) => setColMap((p) => ({ ...p, [key]: e.target.value }))}
                >
                  {columns.map((c) => <option key={c} value={c}>{c}</option>)}
                </Select>
              ))}
            </div>

            {/* Önizleme */}
            {preview.length > 0 && colMap.name && (
              <div className="mt-2 rounded-lg border border-gray-100 overflow-hidden">
                <p className="text-xs font-semibold text-gray-500 px-3 py-2 bg-gray-50">İlk 3 satır önizleme:</p>
                <div className="divide-y divide-gray-50">
                  {preview.map((row, i) => (
                    <div key={i} className="px-3 py-2 text-xs text-gray-700">
                      <span className="font-medium">{row[colMap.name]}</span>
                      {colMap.address && row[colMap.address] && (
                        <span className="text-gray-400 ml-2">{row[colMap.address]}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <Button onClick={handleImport} disabled={!colMap.name} className="flex-1">
                <Upload className="h-4 w-4" />
                {allRows.length} Firmayı Aktar
              </Button>
              <Button variant="secondary" onClick={handleClose}>İptal</Button>
            </div>
          </div>
        )}

        {/* ADIM 3: Yükleniyor */}
        {step === 'importing' && (
          <div className="py-8 text-center space-y-3">
            <svg className="animate-spin h-8 w-8 text-brand mx-auto" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="text-sm text-gray-600">Firmalar aktarılıyor...</p>
          </div>
        )}

        {/* ADIM 4: Tamamlandı */}
        {step === 'done' && (
          <div className="py-6 text-center space-y-4">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
            <div>
              <p className="text-lg font-bold text-gray-900">{result.added} firma eklendi</p>
              {result.skipped > 0 && (
                <p className="text-sm text-gray-400 mt-1">{result.skipped} firma zaten mevcut, atlandı</p>
              )}
            </div>
            <Button onClick={handleClose} className="w-full">Kapat</Button>
          </div>
        )}
      </Modal>
    </>
  )
}
