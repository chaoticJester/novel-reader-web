import { NextRequest, NextResponse } from 'next/server'
import {
    authorSessionCookieName,
    verifySessionToken,
} from '@/lib/author-session'

export function proxy(request: NextRequest) {
    const path = request.nextUrl.pathname

    if (path === '/author/login') {
        return NextResponse.next()
    }

    const token = request.cookies.get(
        authorSessionCookieName,
    )?.value

    if (!verifySessionToken(token)) {
        return NextResponse.redirect(
            new URL('/author/login', request.url),
        )
    }

    return NextResponse.next()
}

export const config = {
    matcher: ['/author/:path*'],
}