'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Trash2 } from 'lucide-react'

interface DeleteVisitButtonProps {
  visitId: string
  companyName: string
}

export function DeleteVisitButton({ visitId, companyName }: DeleteVisitButtonProps) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDelete = async () => {
    setDeleting(true)
    setError(null)
    const { error: err } = await createClient().from('visits').delete().eq('id', visitId)
    if (err) {
      setError(err.message)
      setDeleting(false)
      setConfirming(false)
      return
    }
    router.push('/admin/ziyaretler')
    router.refresh()
  }

  if (confirming) {
    return (
      <div className="flex flex-col gap-2">
        {error && <p className="text-xs text-red-600">{error}</p>}
        <p className="text-sm text-gray-700">
          <strong>{companyName}</strong> ziyaretini silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
        </p>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="danger"
            size="sm"
            loading={deleting}
            onClick={handleDelete}
          >
            Evet, Sil
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setConfirming(false)}
          >
            İptal
          </Button>
        </div>
      </div>
    )
  }

  return (
    <Button
      type="button"
      variant="danger"
      size="sm"
      onClick={() => setConfirming(true)}
    >
      <Trash2 className="h-4 w-4" />
      Ziyareti Sil
    </Button>
  )
}
