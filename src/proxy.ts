import { NextRequest, NextResponse } from 'next/server'
import {
    authorSessionCookieName,
    verifySessionToken,
} from '@/lib/author-session'
import { updateSupabaseSession } from '@/lib/supabase-proxy'

function isAuthorArea(path: string): boolean {
    return path === '/author' || path.startsWith('/author/')
}

export async function proxy(request: NextRequest) {
    // 1) รีเฟรช session ของผู้อ่าน (ทุกหน้า)
    const response = await updateSupabaseSession(request)

    // 2) ล็อกอินผู้เขียนแบบเดิม (เฉพาะ /author)
    const path = request.nextUrl.pathname

    if (isAuthorArea(path) && path !== '/author/login') {
        const token = request.cookies.get(authorSessionCookieName)?.value

        if (!verifySessionToken(token)) {
            const redirect = NextResponse.redirect(
                new URL('/author/login', request.url),
            )
            // ⚠️ คัดลอก cookie ที่เพิ่งรีเฟรชมาใส่ redirect ด้วย ดูคำอธิบายด้านล่าง
            response.cookies.getAll().forEach((cookie) =>
                redirect.cookies.set(cookie),
            )
            return redirect
        }
    }

    return response
}

export const config = {
    // ทุกหน้า ยกเว้นไฟล์ static และรูปภาพ
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
    ],
}