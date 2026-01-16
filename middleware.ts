import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  console.log(`[MIDDLEWARE] Path: ${request.nextUrl.pathname}`)
  
  let response = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  console.log(`[MIDDLEWARE] User:`, user ? 'EXISTS' : 'NONE')

  // If no user and trying to access dashboard → redirect to login
  if (!user && request.nextUrl.pathname.startsWith('/dashboard')) {
    console.log(`[MIDDLEWARE] Redirecting to /auth/login`)
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  // If user exists and on login page → redirect to dashboard
  if (user && request.nextUrl.pathname.startsWith('/auth/login')) {
    console.log(`[MIDDLEWARE] Redirecting to /dashboard`)
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  console.log(`[MIDDLEWARE] No redirect needed`)
  return response
}

export const config = {
  matcher: ['/dashboard/:path*', '/auth/login'],
}