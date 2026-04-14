'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Alert } from '@/components/ui/Alert'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { UserPlus, MoreHorizontal, Trash2 } from 'lucide-react'
import type { Profile } from '@/types'

interface AdminStaffActionsProps {
  mode: 'add' | 'edit'
  profile?: Profile
}

export function AdminStaffActions({ mode, profile }: AdminStaffActionsProps) {
  const [open, setOpen] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [name, setName] = useState(profile?.name ?? '')
  const [email, setEmail] = useState(profile?.email ?? '')
  const [password, setPassword] = useState('')
  const [active, setActive] = useState(profile?.active ?? true)
  const [loading, setLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const supabase = createClient()

    try {
      if (mode === 'add') {
        const res = await fetch('/api/admin/create-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password, role: 'personel' }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? 'Kullanıcı oluşturulamadı.')
      } else if (profile) {
        const { error: updateErr } = await supabase
          .from('profiles')
          .update({ name, active })
          .eq('id', profile.id)
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

  const handleDelete = async () => {
    if (!profile) return
    setDeleteLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/admin/delete-user', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: profile.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Silme işlemi başarısız.')

      setDeleteConfirmOpen(false)
      setOpen(false)
      router.push('/admin/personeller')
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu.')
      setDeleteConfirmOpen(false)
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <>
      {mode === 'add' ? (
        <Button onClick={() => setOpen(true)} size="sm">
          <UserPlus className="h-4 w-4" />
          Personel Ekle
        </Button>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      )}

      {/* Düzenleme Modalı */}
      <Modal
        open={open}
        onClose={() => { setOpen(false); setError(null) }}
        title={mode === 'add' ? 'Yeni Personel Ekle' : 'Personel Düzenle'}
      >
        {error && <Alert variant="error" className="mb-4">{error}</Alert>}
        <form onSubmit={handleSave} className="space-y-4">
          <Input label="Ad Soyad" value={name} onChange={(e) => setName(e.target.value)} required />
          {mode === 'add' && (
            <>
              <Input label="E-posta" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              <Input
                label="Şifre"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                hint="En az 6 karakter"
                required
              />
            </>
          )}
          {mode === 'edit' && (
            <Select
              label="Durum"
              value={active ? 'true' : 'false'}
              onChange={(e) => setActive(e.target.value === 'true')}
            >
              <option value="true">Aktif</option>
              <option value="false">Pasif</option>
            </Select>
          )}
          <div className="flex items-center gap-3 pt-2">
            {mode === 'edit' && (
              <Button
                variant="danger"
                type="button"
                size="sm"
                onClick={() => { setOpen(false); setDeleteConfirmOpen(true) }}
                className="mr-auto"
              >
                <Trash2 className="h-4 w-4" />
                Sil
              </Button>
            )}
            <Button variant="secondary" type="button" onClick={() => setOpen(false)}>İptal</Button>
            <Button type="submit" loading={loading}>
              {mode === 'add' ? 'Ekle' : 'Kaydet'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Silme Onay Modalı */}
      <Modal
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        title="Personeli Kalıcı Sil"
      >
        {error && <Alert variant="error" className="mb-4">{error}</Alert>}
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm font-semibold text-red-800 mb-1">⚠️ Bu işlem geri alınamaz!</p>
            <p className="text-sm text-red-700">
              <strong>{profile?.name}</strong> adlı personel ve tüm ziyaret kayıtları kalıcı olarak silinecek.
            </p>
          </div>
          <p className="text-sm text-gray-600">
            Silmek yerine personeli <strong>Pasif</strong> yaparak sisteme girişini engelleyebilirsiniz.
          </p>
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" type="button" onClick={() => setDeleteConfirmOpen(false)}>
              Vazgeç
            </Button>
            <Button variant="danger" loading={deleteLoading} onClick={handleDelete}>
              <Trash2 className="h-4 w-4" />
              Evet, Kalıcı Sil
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
