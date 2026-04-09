import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 1. 嚴格排除靜態資源，這是防止電腦當機的關鍵
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // 2. 初始化 Supabase
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables!')
    return response
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({
            request: { headers: request.headers },
          })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({
            request: { headers: request.headers },
          })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  // 3. 獲取用戶 Session
  const { data: { session } } = await supabase.auth.getSession()

  // 4. 自動跳轉邏輯
  const isAuthPage = pathname === '/login' || pathname === '/register'
  const isLandingPage = pathname === '/'

  if (session) {
    // [已登入]
    // 如果訪問首頁、登入頁、註冊頁 -> 全部強行導向儀表板
    if (isLandingPage || isAuthPage) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  } else {
    // [未登入]
    // 如果訪問的是後台頁面 (這裡檢查是否以 /dashboard 開頭) -> 導向首頁 (Landing Page)
    if (pathname.startsWith('/dashboard') && !isLandingPage && !isAuthPage) {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.).*)'],
}
