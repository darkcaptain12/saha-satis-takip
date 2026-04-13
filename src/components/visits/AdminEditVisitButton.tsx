'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import { Alert } from '@/components/ui/Alert'
import { Modal } from '@/components/ui/Modal'
import { Pencil } from 'lucide-react'
import { VISIT_STATUS_OPTIONS } from '@/components/visits/VisitStatusBadge'
import type { Visit, VisitStatus } from '@/types'

interface AdminEditVisitButtonProps {
  visit: Pick<Visit, 'id' | 'note' | 'status'>
}

export function AdminEditVisitButton({ visit }: AdminEditVisitButtonProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [note, setNote] = useState(visit.note ?? '')
  const [status, setStatus] = useState<VisitStatus | ''>(visit.status ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleOpen = () => {
    setNote(visit.note ?? '')
    setStatus(visit.status ?? '')
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
      })
      .eq('id', visit.id)

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

          <Textarea
            label="Ziyaret Notu"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Görüşme özeti, teklifler, sonraki adımlar..."
            rows={5}
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
