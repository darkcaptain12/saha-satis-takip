'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useGPS } from '@/hooks/useGPS'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Alert } from '@/components/ui/Alert'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { MapPin, Navigation, PenLine } from 'lucide-react'
import { getTodayIso, getCurrentTimeStr } from '@/lib/utils'
import type { Company, GPSCapture } from '@/types'

interface VisitFormProps {
  userId: string
}

type LocationMode = 'gps' | 'manual'

export function VisitForm({ userId }: VisitFormProps) {
  const router = useRouter()
  const { capturing, capture } = useGPS()

  const [companies, setCompanies] = useState<Company[]>([])
  const [companyInput, setCompanyInput] = useState('')
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [note, setNote] = useState('')
  const [locationMode, setLocationMode] = useState<LocationMode>('gps')
  const [gpsResult, setGpsResult] = useState<GPSCapture | null>(null)
  const [manualAddress, setManualAddress] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const todayStr = getTodayIso()
  const timeRef = useRef(getCurrentTimeStr())

  useEffect(() => {
    createClient()
      .from('companies')
      .select('*')
      .order('name')
      .then(({ data }: { data: Company[] | null }) => setCompanies(data ?? []))
  }, [])

  const filteredCompanies = companies.filter((c) =>
    companyInput.length >= 1 &&
    c.name.toLowerCase().includes(companyInput.toLowerCase())
  )

  const handleCompanySelect = (c: Company) => {
    setSelectedCompany(c)
    setCompanyInput(c.name)
    setShowSuggestions(false)
  }

  const handleCompanyInput = (val: string) => {
    setCompanyInput(val)
    setSelectedCompany(null)
    setShowSuggestions(val.length >= 1)
  }

  const handleGetLocation = async () => {
    const result = await capture()
    setGpsResult(result)
  }

  const handleModeSwitch = (mode: LocationMode) => {
    setLocationMode(mode)
    setGpsResult(null)
    setManualAddress('')
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!companyInput.trim()) {
      setError('Firma adı giriniz.')
      return
    }

    let latitude: number | null = null
    let longitude: number | null = null
    let accuracy: number | null = null
    let location_status: 'success' | 'failed' | 'skipped' | 'manual' = 'skipped'
    let address: string | null = null

    if (locationMode === 'gps') {
      let location = gpsResult
      if (!location) {
        location = await capture()
        setGpsResult(location)
      }

      if (!location || location.status === 'failed') {
        setError(
          `Konum alınamadı${location?.status === 'failed' ? `: ${(location as { status: 'failed'; reason: string }).reason}` : ''}. Konum izni vermek için tarayıcı adres çubuğundaki kilit simgesine tıklayın.`
        )
        return
      }

      latitude = location.latitude
      longitude = location.longitude
      accuracy = location.accuracy
      location_status = 'success'
    } else {
      // Manuel adres modu
      if (!manualAddress.trim()) {
        setError('Manuel adres giriniz.')
        return
      }
      address = manualAddress.trim()
      location_status = 'manual'
    }

    setSubmitting(true)

    const visitData = {
      user_id: userId,
      company_id: selectedCompany?.id ?? null,
      company_name_snapshot: companyInput.trim(),
      note: note.trim() || null,
      visit_date: todayStr,
      visit_time: timeRef.current,
      latitude,
      longitude,
      accuracy,
      location_status,
      address,
    }

    const { error: insertErr } = await createClient().from('visits').insert(visitData)

    if (insertErr) {
      setError(insertErr.message)
      setSubmitting(false)
      return
    }

    router.push('/personel/ziyaretlerim')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && <Alert variant="error">{error}</Alert>}

      {/* Tarih ve Saat (otomatik) */}
      <div className="grid grid-cols-2 gap-4">
        <Input label="Tarih" value={todayStr} readOnly className="bg-gray-50" />
        <Input label="Saat" value={timeRef.current} readOnly className="bg-gray-50" />
      </div>

      {/* Firma seçimi */}
      <div className="relative">
        <Input
          label="Firma Adı"
          value={companyInput}
          onChange={(e) => handleCompanyInput(e.target.value)}
          onFocus={() => companyInput.length >= 1 && setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          placeholder="Kayıtlı firma seç veya yeni yaz..."
          required
        />
        {showSuggestions && filteredCompanies.length > 0 && (
          <div className="absolute z-10 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
            {filteredCompanies.map((c) => (
              <button
                key={c.id}
                type="button"
                onMouseDown={() => handleCompanySelect(c)}
                className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors"
              >
                {c.name}
                {c.address && <span className="text-gray-400 text-xs ml-2">{c.address}</span>}
              </button>
            ))}
          </div>
        )}
        {selectedCompany && (
          <p className="text-xs text-green-600 mt-1">✓ Kayıtlı firma seçildi</p>
        )}
      </div>

      {/* Not */}
      <Textarea
        label="Ziyaret Notu"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Görüşme özeti, teklifler, sonraki adımlar..."
        rows={4}
      />

      {/* Konum Modu Seçimi */}
      <Card className="p-4">
        <p className="text-sm font-medium text-gray-700 mb-3">Konum Bilgisi</p>

        {/* Tab seçici */}
        <div className="flex rounded-lg border border-gray-200 overflow-hidden mb-4">
          <button
            type="button"
            onClick={() => handleModeSwitch('gps')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium transition-colors ${
              locationMode === 'gps'
                ? 'bg-brand text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Navigation className="h-4 w-4" />
            GPS Konum
          </button>
          <button
            type="button"
            onClick={() => handleModeSwitch('manual')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium transition-colors border-l border-gray-200 ${
              locationMode === 'manual'
                ? 'bg-brand text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            <PenLine className="h-4 w-4" />
            Manuel Adres
          </button>
        </div>

        {/* GPS Modu */}
        {locationMode === 'gps' && (
          <>
            {gpsResult?.status === 'success' && (
              <div className="flex items-center justify-between mb-3">
                <Badge variant="green">
                  <MapPin className="h-3 w-3" /> Konum Alındı
                </Badge>
                <span className="text-xs text-gray-400">±{gpsResult.accuracy.toFixed(0)}m doğruluk</span>
              </div>
            )}
            {gpsResult?.status === 'success' && (
              <div className="bg-green-50 rounded-lg p-3 mb-3 text-xs text-green-700 space-y-0.5">
                <p><strong>Lat:</strong> {gpsResult.latitude.toFixed(6)}</p>
                <p><strong>Lng:</strong> {gpsResult.longitude.toFixed(6)}</p>
              </div>
            )}
            {gpsResult?.status === 'failed' && (
              <Alert variant="warning" className="mb-3 text-xs">
                {gpsResult.reason}
              </Alert>
            )}
            <Button
              type="button"
              variant={gpsResult?.status === 'success' ? 'secondary' : 'primary'}
              size="md"
              loading={capturing}
              onClick={handleGetLocation}
              className="w-full"
            >
              <Navigation className="h-4 w-4" />
              {gpsResult?.status === 'success' ? 'Konumu Yenile' : 'Konumu Al'}
            </Button>
            <p className="text-xs text-gray-400 mt-2 text-center">
              Kayıt oluşturulurken anlık konumunuz alınır
            </p>
          </>
        )}

        {/* Manuel Adres Modu */}
        {locationMode === 'manual' && (
          <>
            <Badge variant="blue" className="mb-3">
              <PenLine className="h-3 w-3" /> Manuel Adres
            </Badge>
            <Textarea
              label="Adres"
              value={manualAddress}
              onChange={(e) => setManualAddress(e.target.value)}
              placeholder="Ziyaret adresi girin (sokak, mahalle, ilçe...)"
              rows={3}
            />
            <p className="text-xs text-gray-400 mt-2">
              GPS sinyali alınamadığında veya tam adresi yazmak istediğinizde kullanın
            </p>
          </>
        )}
      </Card>

      <Button
        type="submit"
        size="lg"
        loading={submitting}
        className="w-full"
      >
        Ziyareti Kaydet
      </Button>
    </form>
  )
}
