import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // getUser() sunucu taraflı doğrulama + token yenileme tetikler
  const { data: { user } } = await supabase.auth.getUser()

  // Giriş yapmamış → /login'e yönlendir
  if (!user && pathname !== '/login') {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Giriş yapmış + /login açıyor → dashboard'a yönlendir
  if (user && pathname === '/login') {
    const role = await resolveRole(supabase, user)
    if (role === null) return response
    const dest = role === 'admin' ? '/admin/dashboard' : '/personel/dashboard'
    return NextResponse.redirect(new URL(dest, request.url))
  }

  // Kök yol → dashboard'a yönlendir
  if (user && pathname === '/') {
    const role = await resolveRole(supabase, user)
    if (role === null) return response
    const dest = role === 'admin' ? '/admin/dashboard' : '/personel/dashboard'
    return NextResponse.redirect(new URL(dest, request.url))
  }

  // /admin/* → sadece admin erişebilir
  if (pathname.startsWith('/admin')) {
    const role = await resolveRole(supabase, user!)
    if (role === null) return response
    if (role !== 'admin') {
      return NextResponse.redirect(new URL('/personel/dashboard', request.url))
    }
  }

  // /personel/* → sadece personel erişebilir
  if (pathname.startsWith('/personel')) {
    const role = await resolveRole(supabase, user!)
    if (role === null) return response
    if (role !== 'personel') {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url))
    }
  }

  return response
}

/**
 * Kullanıcı rolünü belirler.
 * 1. Hızlı yol: JWT user_metadata.role — DB çağrısı YOK.
 *    Bu sistem üzerinden oluşturulan tüm kullanıcılarda mevcuttur.
 * 2. Yavaş yol (fallback): DB'den profiles.role oku.
 *    SQL ile elle oluşturulan hesaplar veya metadata eksikse devreye girer.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function resolveRole(supabase: any, user: any): Promise<string | null> {
  const metaRole = user?.user_metadata?.role as string | undefined
  if (metaRole === 'admin' || metaRole === 'personel') return metaRole
  return await getUserRole(supabase, user.id)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getUserRole(supabase: any, userId: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()

    if (error || !data?.role) return null
    return data.role as string
  } catch {
    return null
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|leaflet|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
