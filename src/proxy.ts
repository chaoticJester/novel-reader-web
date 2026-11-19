import { NextRequest, NextResponse } from 'next/server'
import { updateSupabaseSession } from '@/lib/supabase-proxy'

function isAuthorArea(path: string): boolean {
    return path === '/author' || path.startsWith('/author/')
}

function redirectWithCookies(url: URL, from: NextResponse): NextResponse {
    const redirect = NextResponse.redirect(url)
    from.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie))
    return redirect
}

export async function proxy(request: NextRequest) {
    const { response, supabase, userId } = await updateSupabaseSession(request)

    const path = request.nextUrl.pathname
    if (!isAuthorArea(path)) {
        return response
    }

    if (!userId) {
        const loginUrl = new URL('/login', request.url)
        loginUrl.searchParams.set('next', path)
        return redirectWithCookies(loginUrl, response)
    }

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