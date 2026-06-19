'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Alert } from '@/components/ui/Alert'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { PlusCircle, MoreHorizontal } from 'lucide-react'
import type { Company } from '@/types'

interface AdminCompanyActionsProps {
  mode: 'add' | 'edit'
  company?: Company
}

export function AdminCompanyActions({ mode, company }: AdminCompanyActionsProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(company?.name ?? '')
  const [address, setAddress] = useState(company?.address ?? '')
  const [phone, setPhone] = useState(company?.phone ?? '')
  const [note, setNote] = useState(company?.note ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const supabase = createClient()

    try {
      if (mode === 'add') {
        const { error: insertErr } = await supabase.from('companies').insert({
          name, address: address || null, phone: phone || null, note: note || null,
        })
        if (insertErr) throw insertErr
      } else if (company) {
        const { error: updateErr } = await supabase
          .from('companies')
          .update({ name, address: address || null, phone: phone || null, note: note || null })
          .eq('id', company.id)
        if (updateErr) throw updateErr
      }
      setOpen(false)
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu.')
    } finally {
      setLoading(false)
    }
  }

  const resetAndOpen = () => {
    if (mode === 'add') {
      setName(''); setAddress(''); setPhone(''); setNote('')
    }
    setError(null)
    setOpen(true)
  }

  return (
    <>
      {mode === 'add' ? (
        <Button onClick={resetAndOpen} size="sm">
          <PlusCircle className="h-4 w-4" />
          Firma Ekle
        </Button>
      ) : (
        <button
          onClick={() => { setError(null); setOpen(true) }}
          className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      )}

      <Modal
        open={open}
        onClose={() => { setOpen(false); setError(null) }}
        title={mode === 'add' ? 'Yeni Firma Ekle' : 'Firma Düzenle'}
      >
        {error && <Alert variant="error" className="mb-4">{error}</Alert>}
        <form onSubmit={handleSave} className="space-y-4">
          <Input label="Firma Adı" value={name} onChange={(e) => setName(e.target.value)} required />
          <Input label="Adres" value={address} onChange={(e) => setAddress(e.target.value)} />
          <Input label="Telefon" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <Textarea label="Not" value={note} onChange={(e) => setNote(e.target.value)} rows={3} />
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="secondary" type="button" onClick={() => setOpen(false)}>İptal</Button>
            <Button type="submit" loading={loading}>
              {mode === 'add' ? 'Ekle' : 'Kaydet'}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  )
}
