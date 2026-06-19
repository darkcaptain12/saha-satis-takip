'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import { Alert } from '@/components/ui/Alert'
import { Modal } from '@/components/ui/Modal'
import { Pencil } from 'lucide-react'
import { VISIT_STATUS_OPTIONS } from '@/components/visits/VisitStatusBadge'
import type { Visit, VisitStatus } from '@/types'

interface PersonelEditVisitButtonProps {
  visit: Pick<Visit, 'id' | 'note' | 'status' | 'visit_date' | 'contact_name' | 'contact_title'>
  userId: string
}

export function PersonelEditVisitButton({ visit, userId }: PersonelEditVisitButtonProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [note, setNote] = useState(visit.note ?? '')
  const [status, setStatus] = useState<VisitStatus | ''>(visit.status ?? '')
  const [visitDate, setVisitDate] = useState(visit.visit_date)
  const [contactName, setContactName] = useState(visit.contact_name ?? '')
  const [contactTitle, setContactTitle] = useState(visit.contact_title ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleOpen = () => {
    setNote(visit.note ?? '')
    setStatus(visit.status ?? '')
    setVisitDate(visit.visit_date)
    setContactName(visit.contact_name ?? '')
    setContactTitle(visit.contact_title ?? '')
    setError(null)
    setOpen(true)
  }

  const handleSave = async () => {
    setLoading(true)
    setError(null)

    const { error: err } = await createClient()
      .from('visits')
      .update({
        note: note.trim() || null,
        status: status || null,
        visit_date: visitDate,
        contact_name: contactName.trim() || null,
        contact_title: contactTitle.trim() || null,
      })
      .eq('id', visit.id)
      .eq('user_id', userId)

    if (err) {
      setError(err.message)
      setLoading(false)
      return
    }

    setOpen(false)
    router.refresh()
  }

  return (
    <>
      <Button type="button" variant="secondary" size="sm" onClick={handleOpen}>
        <Pencil className="h-4 w-4" />
        Düzenle
      </Button>

      <Modal
        open={open}
        onClose={() => { setOpen(false); setError(null) }}
        title="Ziyareti Düzenle"
        size="sm"
      >
        <div className="space-y-4">
          {error && <Alert variant="error">{error}</Alert>}

          <Input
            label="Tarih"
            type="date"
            value={visitDate}
            onChange={(e) => setVisitDate(e.target.value)}
          />

          <Select
            label="Ziyaret Durumu"
            placeholder="Durum seçin"
            value={status}
            onChange={(e) => setStatus(e.target.value as VisitStatus | '')}
          >
            {VISIT_STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </Select>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Görüşülen Kişi"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder="Ad Soyad"
            />
            <Input
              label="Ünvanı"
              value={contactTitle}
              onChange={(e) => setContactTitle(e.target.value)}
              placeholder="Müdür, Öğretmen..."
            />
          </div>

          <Textarea
            label="Ziyaret Notu"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Görüşme özeti, teklifler, sonraki adımlar..."
            rows={4}
          />

          <div className="flex gap-2 pt-1">
            <Button size="sm" loading={loading} onClick={handleSave} className="flex-1">
              Kaydet
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => { setOpen(false); setError(null) }}
            >
              İptal
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
