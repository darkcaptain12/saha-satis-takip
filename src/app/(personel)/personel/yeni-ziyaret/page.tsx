import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { VisitForm } from '@/components/visits/VisitForm'

export default async function YeniZiyaretPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Aktif hesap kontrolü
  const { data: profile } = await supabase
    .from('profiles')
    .select('active')
    .eq('id', user.id)
    .single()

  if (!profile?.active) {
    return (
      <div className="flex flex-col items-center justify-center min-h-64 text-center p-6">
        <p className="text-red-600 font-medium">Hesabınız pasif durumda.</p>
        <p className="text-sm text-gray-500 mt-2">Yöneticinizle iletişime geçin.</p>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-5">
        <h1 className="text-xl font-bold text-gray-900">Yeni Ziyaret Kaydı</h1>
        <p className="text-sm text-gray-500 mt-1">Ziyaret bilgilerini doldurun ve konumunuzu alın.</p>
      </div>
      <VisitForm userId={user.id} />
    </div>
  )
}
