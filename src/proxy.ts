import { NextRequest, NextResponse } from 'next/server'
import { updateSupabaseSession } from '@/lib/supabase-proxy'

function isUnder(path: string, base: string): boolean {
    return path === base || path.startsWith(`${base}/`)
}

const LOGIN_REQUIRED = ['/profile', '/library']

function redirectWithCookies(url: URL, from: NextResponse): NextResponse {
    const redirect = NextResponse.redirect(url)
    from.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie))
    return redirect
}

export async function proxy(request: NextRequest) {
    // 1) รีเฟรช session (ทุกหน้า)
    const { response, supabase, userId } = await updateSupabaseSession(request)

    const path = request.nextUrl.pathname
    const needsAdmin = isUnder(path, '/author')
    const needsLogin = needsAdmin || LOGIN_REQUIRED.some((base) => isUnder(path, base))

    if (!needsLogin) {
        return response
    }

    // 2) ยังไม่ล็อกอิน → ไปหน้าล็อกอิน แล้วกลับมาที่เดิม
    if (!userId) {
        const loginUrl = new URL('/login', request.url)
        loginUrl.searchParams.set('next', path)
        return redirectWithCookies(loginUrl, response)
    }

    if (!needsAdmin) {
        return response
    }

    // 3) /author: ต้องเป็น admin
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .maybeSingle()

    if (profile?.role !== 'admin') {
        return redirectWithCookies(new URL('/', request.url), response)
    }

    return response
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
    ],
}