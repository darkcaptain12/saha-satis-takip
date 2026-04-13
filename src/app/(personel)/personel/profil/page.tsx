'use client'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { uploadPhoto } from '@/hooks/usePhotoUpload'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { Badge } from '@/components/ui/Badge'
import { User, LogOut, Camera } from 'lucide-react'
import Image from 'next/image'

export default function ProfilPage() {
  const { profile, signOut, loading } = useAuth()
  const [name, setName] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const avatarInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (profile) {
      setName(profile.name)
      setAvatarUrl(profile.avatar_url)
    }
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

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !profile) return

    setAvatarUploading(true)
    setMessage(null)

    const ext = file.name.split('.').pop() ?? 'jpg'
    const path = `${profile.id}.${ext}`
    const url = await uploadPhoto(file, 'avatars', path)

    if (!url) {
      setMessage({ type: 'error', text: 'Fotoğraf yüklenemedi.' })
      setAvatarUploading(false)
      return
    }

    const supabase = createClient()
    const { error } = await supabase
      .from('profiles')
      .update({ avatar_url: url })
      .eq('id', profile.id)

    if (error) {
      setMessage({ type: 'error', text: 'Profil fotoğrafı kaydedilemedi.' })
    } else {
      setAvatarUrl(url)
      setMessage({ type: 'success', text: 'Profil fotoğrafı güncellendi.' })
    }
    setAvatarUploading(false)
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
          {/* Avatar */}
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              disabled={avatarUploading}
              className="relative block rounded-full overflow-hidden w-16 h-16 group"
            >
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt="Profil fotoğrafı"
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="bg-brand/10 rounded-full w-16 h-16 flex items-center justify-center">
                  <User className="h-8 w-8 text-brand" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                {avatarUploading ? (
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <Camera className="h-5 w-5 text-white" />
                )}
              </div>
            </button>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>

          <div>
            <p className="font-semibold text-gray-900">{profile.name}</p>
            <p className="text-sm text-gray-500">{profile.email}</p>
            <Badge variant="blue" className="mt-1">Saha Personeli</Badge>
            <p className="text-xs text-gray-400 mt-1">Fotoğrafa tıkla değiştir</p>
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
