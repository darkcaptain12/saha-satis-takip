'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useGPS } from '@/hooks/useGPS'
import { uploadPhoto } from '@/hooks/usePhotoUpload'
import { findNearbyCompanies } from '@/hooks/useNearbyCompanies'
import type { NearbyResult } from '@/hooks/useNearbyCompanies'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import { Alert } from '@/components/ui/Alert'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { MapPin, Navigation, PenLine, Camera, X, Locate } from 'lucide-react'
import { getTodayIso, getCurrentTimeStr } from '@/lib/utils'
import { VISIT_STATUS_OPTIONS } from '@/components/visits/VisitStatusBadge'
import type { Company, GPSCapture, VisitStatus } from '@/types'

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
  const [nearbyResults, setNearbyResults] = useState<NearbyResult[]>([])
  const [nearbyLoading, setNearbyLoading] = useState(false)
  const [visitStatus, setVisitStatus] = useState<VisitStatus | ''>('')
  const [note, setNote] = useState('')
  const [locationMode, setLocationMode] = useState<LocationMode>('gps')
  const [gpsResult, setGpsResult] = useState<GPSCapture | null>(null)
  const [manualAddress, setManualAddress] = useState('')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)

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
    setNearbyResults([]) // öneri kutusu kapansın
  }

  const handleCompanyInput = (val: string) => {
    setCompanyInput(val)
    setSelectedCompany(null)
    setShowSuggestions(val.length >= 1)
    if (val.length >= 1) setNearbyResults([]) // yazmaya başlayınca öneri silinir
  }

  const handleGetLocation = async () => {
    setNearbyResults([])
    const result = await capture()
    setGpsResult(result)

    if (result.status === 'success' && companies.length > 0) {
      setNearbyLoading(true)
      const nearby = await findNearbyCompanies(result.latitude, result.longitude, companies)
      setNearbyResults(nearby)
      setNearbyLoading(false)
    }
  }

  const handleModeSwitch = (mode: LocationMode) => {
    setLocationMode(mode)
    setGpsResult(null)
    setManualAddress('')
    setNearbyResults([])
    setError(null)
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  const handleRemovePhoto = () => {
    setPhotoFile(null)
    setPhotoPreview(null)
    if (photoInputRef.current) photoInputRef.current.value = ''
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
      if (!manualAddress.trim()) {
        setError('Manuel adres giriniz.')
        return
      }
      address = manualAddress.trim()
      location_status = 'manual'
    }

    setSubmitting(true)

    let photo_url: string | null = null
    if (photoFile) {
      const ext = photoFile.name.split('.').pop() ?? 'jpg'
      const path = `${userId}/${Date.now()}.${ext}`
      photo_url = await uploadPhoto(photoFile, 'visit-photos', path)
      if (!photo_url) {
        setError('Fotoğraf yüklenemedi, lütfen tekrar deneyin veya fotoğraf olmadan kaydedin.')
        setSubmitting(false)
        return
      }
    }

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
      status: visitStatus || null,
      photo_url,
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

      {/* Tarih ve Saat */}
      <div className="grid grid-cols-2 gap-4">
        <Input label="Tarih" value={todayStr} readOnly className="bg-gray-50" />
        <Input label="Saat" value={timeRef.current} readOnly className="bg-gray-50" />
      </div>

      {/* Firma seçimi */}
      <div className="space-y-2">
        {/* Yakın firma önerileri */}
        {(nearbyLoading || nearbyResults.length > 0) && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-xs font-semibold text-amber-700 flex items-center gap-1 mb-2">
              <Locate className="h-3.5 w-3.5" />
              Konumunuza Yakın Okullar
            </p>
            {nearbyLoading ? (
              <p className="text-xs text-amber-600">Yakın okullar aranıyor...</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {nearbyResults.map(({ company, distance, matchType }) => (
                  <button
                    key={company.id}
                    type="button"
                    onClick={() => handleCompanySelect(company)}
                    className="flex items-center gap-1.5 bg-white border border-amber-300 rounded-full px-3 py-1.5 text-xs font-medium text-amber-800 hover:bg-amber-100 transition-colors text-left"
                  >
                    <span className="truncate max-w-[200px]">{company.name}</span>
                    {matchType === 'gps' && distance != null && (
                      <span className="text-amber-500 shrink-0">~{Math.round(distance)}m</span>
                    )}
                    {matchType === 'address' && (
                      <span className="text-amber-400 shrink-0">aynı bölge</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="relative">
          <Input
            label="Firma Adı"
            value={companyInput}
            onChange={(e) => handleCompanyInput(e.target.value)}
            onFocus={() => companyInput.length >= 1 && setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            placeholder="Yakın okulu seç veya firma adı yaz..."
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
            <p className="text-xs text-green-600 mt-1">✓ Kayıtlı okul/firma seçildi</p>
          )}
        </div>
      </div>

      {/* Ziyaret Durumu */}
      <Select
        label="Ziyaret Durumu"
        placeholder="Durum seçin (isteğe bağlı)"
        value={visitStatus}
        onChange={(e) => setVisitStatus(e.target.value as VisitStatus | '')}
      >
        {VISIT_STATUS_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </Select>

      {/* Not */}
      <Textarea
        label="Ziyaret Notu"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Görüşme özeti, teklifler, sonraki adımlar..."
        rows={4}
      />

      {/* Konum */}
      <Card className="p-4">
        <p className="text-sm font-medium text-gray-700 mb-3">Konum Bilgisi</p>

        <div className="flex rounded-lg border border-gray-200 overflow-hidden mb-4">
          <button
            type="button"
            onClick={() => handleModeSwitch('gps')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium transition-colors ${
              locationMode === 'gps' ? 'bg-brand text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Navigation className="h-4 w-4" />
            GPS Konum
          </button>
          <button
            type="button"
            onClick={() => handleModeSwitch('manual')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium transition-colors border-l border-gray-200 ${
              locationMode === 'manual' ? 'bg-brand text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            <PenLine className="h-4 w-4" />
            Manuel Adres
          </button>
        </div>

        {locationMode === 'gps' && (
          <>
            {gpsResult?.status === 'success' && (
              <div className="flex items-center justify-between mb-3">
                <Badge variant="green"><MapPin className="h-3 w-3" /> Konum Alındı</Badge>
                <span className="text-xs text-gray-400">±{gpsResult.accuracy.toFixed(0)}m</span>
              </div>
            )}
            {gpsResult?.status === 'success' && (
              <div className="bg-green-50 rounded-lg p-3 mb-3 text-xs text-green-700 space-y-0.5">
                <p><strong>Lat:</strong> {gpsResult.latitude.toFixed(6)}</p>
                <p><strong>Lng:</strong> {gpsResult.longitude.toFixed(6)}</p>
              </div>
            )}
            {gpsResult?.status === 'failed' && (
              <Alert variant="warning" className="mb-3 text-xs">{gpsResult.reason}</Alert>
            )}
            <Button
              type="button"
              variant={gpsResult?.status === 'success' ? 'secondary' : 'primary'}
              size="md"
              loading={capturing || nearbyLoading}
              onClick={handleGetLocation}
              className="w-full"
            >
              <Navigation className="h-4 w-4" />
              {gpsResult?.status === 'success' ? 'Konumu Yenile' : 'Konumu Al → Yakın Okul Bul'}
            </Button>
            <p className="text-xs text-gray-400 mt-2 text-center">
              Konum alındıktan sonra yakın okullar otomatik önerilir
            </p>
          </>
        )}

        {locationMode === 'manual' && (
          <>
            <Badge variant="blue" className="mb-3"><PenLine className="h-3 w-3" /> Manuel Adres</Badge>
            <Textarea
              label="Adres"
              value={manualAddress}
              onChange={(e) => setManualAddress(e.target.value)}
              placeholder="Ziyaret adresi girin (sokak, mahalle, ilçe...)"
              rows={3}
            />
            <p className="text-xs text-gray-400 mt-2">GPS sinyali alınamadığında veya tam adres yazmak istediğinizde kullanın</p>
          </>
        )}
      </Card>

      {/* Fotoğraf */}
      <Card className="p-4">
        <p className="text-sm font-medium text-gray-700 mb-3">
          Ziyaret Fotoğrafı <span className="text-gray-400 font-normal">(isteğe bağlı)</span>
        </p>

        {photoPreview ? (
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photoPreview} alt="Önizleme" className="w-full max-h-48 object-cover rounded-lg" />
            <button
              type="button"
              onClick={handleRemovePhoto}
              className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-700 transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => photoInputRef.current?.click()}
            className="w-full border-2 border-dashed border-gray-200 rounded-lg py-6 flex flex-col items-center gap-2 text-gray-400 hover:border-brand hover:text-brand transition-colors"
          >
            <Camera className="h-6 w-6" />
            <span className="text-sm">Fotoğraf Çek / Seç</span>
          </button>
        )}
        <input
          ref={photoInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handlePhotoChange}
        />
      </Card>

      <Button type="submit" size="lg" loading={submitting} className="w-full">
        Ziyareti Kaydet
      </Button>
    </form>
  )
}
