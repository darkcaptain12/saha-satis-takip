import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  // İstek yapan kullanıcının admin olup olmadığını doğrula
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Yetkisiz erişim.' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Bu işlem için admin yetkisi gereklidir.' }, { status: 403 })
  }

  const { name, email, password, role } = await request.json()

  if (!name || !email || !password) {
    return NextResponse.json({ error: 'Ad, e-posta ve şifre gereklidir.' }, { status: 400 })
  }

  if (password.length < 6) {
    return NextResponse.json({ error: 'Şifre en az 6 karakter olmalıdır.' }, { status: 400 })
  }

  // Service role key ile admin client oluştur
  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,      // e-posta doğrulama gerektirme
    user_metadata: { name, role: role ?? 'personel' },
  })

  if (createError) {
    return NextResponse.json({ error: createError.message }, { status: 400 })
  }

  // Profil trigger tarafından otomatik oluşturulur.
  // Ama trigger olmayabilir, elle de insert edelim (ON CONFLICT DO NOTHING ile)
  await adminClient.from('profiles').upsert({
    id: newUser.user.id,
    name,
    email,
    role: role ?? 'personel',
    active: true,
  })

  return NextResponse.json({ success: true, userId: newUser.user.id })
}
