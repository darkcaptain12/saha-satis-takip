'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'
import { Printer } from 'lucide-react'

const errorMessages: Record<string, string> = {
  'Invalid login credentials': 'E-posta veya şifre hatalı.',
  'Email not confirmed': 'E-posta adresi doğrulanmamış.',
  'Too many requests': 'Çok fazla deneme. Lütfen birkaç dakika bekleyin.',
  'User not found': 'Bu e-posta ile kayıtlı kullanıcı bulunamadı.',
}

function mapError(message: string): string {
  for (const [key, val] of Object.entries(errorMessages)) {
    if (message.includes(key)) return val
  }
  return 'Giriş başarısız. Lütfen tekrar deneyin.'
}

export function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    if (authError) {
      setError(mapError(authError.message))
      setLoading(false)
      return
    }

    // Rolü al ve yönlendir
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError('Kullanıcı bilgisi alınamadı.')
      setLoading(false)
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, active')
      .eq('id', user.id)
      .single()

    if (!profile) {
      setError('Kullanıcı profili bulunamadı.')
      setLoading(false)
      return
    }

    if (!profile.active) {
      await supabase.auth.signOut()
      setError('Hesabınız pasif durumdadır. Yöneticinizle iletişime geçin.')
      setLoading(false)
      return
    }

    router.push(profile.role === 'admin' ? '/admin/dashboard' : '/personel/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand to-brand-light px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center bg-white/15 rounded-2xl p-4 mb-4">
            <Printer className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Saha Satış Takip</h1>
          <p className="text-white/70 text-sm mt-1">Hesabınıza giriş yapın</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {error && (
            <div className="mb-5">
              <Alert variant="error">{error}</Alert>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="E-posta Adresi"
              type="email"
              placeholder="ornek@sirket.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              autoFocus
            />
            <Input
              label="Şifre"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
            <Button
              type="submit"
              size="lg"
              loading={loading}
              className="w-full mt-2"
            >
              Giriş Yap
            </Button>
          </form>
        </div>

        <p className="text-center text-white/50 text-xs mt-6">
          Admin ve personel aynı ekrandan giriş yapar
        </p>
      </div>
    </div>
  )
}
