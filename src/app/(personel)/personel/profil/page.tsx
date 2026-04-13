'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { Badge } from '@/components/ui/Badge'
import { User, LogOut } from 'lucide-react'

export default function ProfilPage() {
  const { profile, signOut, loading } = useAuth()
  const [name, setName] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    if (profile) setName(profile.name)
  }, [profile])

  const handleSaveName = async () => {
    setSaving(true)
    setMessage(null)
    const supabase = createClient()
    const { error } = await supabase
      .from('profiles')
      .update({ name })
      .eq('id', profile!.id)

    setMessage(error
      ? { type: 'error', text: 'İsim güncellenemedi.' }
      : { type: 'success', text: 'İsim güncellendi.' }
    )
    setSaving(false)
  }

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Şifre en az 6 karakter olmalıdır.' })
      return
    }
    setSaving(true)
    setMessage(null)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setMessage(error
      ? { type: 'error', text: 'Şifre değiştirilemedi.' }
      : { type: 'success', text: 'Şifre başarıyla değiştirildi.' }
    )
    setNewPassword('')
    setSaving(false)
  }

  if (loading) return <p className="text-center text-gray-400 py-10">Yükleniyor...</p>
  if (!profile) return null

  return (
    <div className="max-w-md mx-auto space-y-5">
      <h1 className="text-xl font-bold text-gray-900">Profilim</h1>

      {message && (
        <Alert variant={message.type === 'success' ? 'success' : 'error'}>
          {message.text}
        </Alert>
      )}

      {/* Profil bilgisi */}
      <Card>
        <div className="flex items-center gap-4 mb-6">
          <div className="bg-brand/10 rounded-full p-4">
            <User className="h-8 w-8 text-brand" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">{profile.name}</p>
            <p className="text-sm text-gray-500">{profile.email}</p>
            <Badge variant="blue" className="mt-1">Saha Personeli</Badge>
          </div>
        </div>

        <div className="space-y-4">
          <Input
            label="Ad Soyad"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Button onClick={handleSaveName} loading={saving} className="w-full">
            İsmi Güncelle
          </Button>
        </div>
      </Card>

      {/* Şifre değiştir */}
      <Card>
        <h3 className="font-semibold text-gray-900 mb-4">Şifre Değiştir</h3>
        <div className="space-y-4">
          <Input
            label="Yeni Şifre"
            type="password"
            placeholder="En az 6 karakter"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <Button onClick={handleChangePassword} loading={saving} variant="secondary" className="w-full">
            Şifreyi Değiştir
          </Button>
        </div>
      </Card>

      {/* Çıkış */}
      <Button
        variant="danger"
        onClick={signOut}
        className="w-full"
      >
        <LogOut className="h-4 w-4" />
        Çıkış Yap
      </Button>
    </div>
  )
}
