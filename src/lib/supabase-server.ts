import 'server-only'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// สร้างใหม่ทุก request เพราะต้องอ่าน cookie ของ request นั้นๆ
// ห้ามสร้างไว้ตัวเดียวแล้วใช้ร่วมกัน (ผู้ใช้จะเห็น session ของกันและกัน)
export async function createSupabaseServerClient() {
    const cookieStore = await cookies()

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options),
                        )
                    } catch {
                        // Server Component ตั้ง cookie ไม่ได้ (ทำได้เฉพาะใน
                        // Server Action / Route Handler) ไม่เป็นไร เพราะ proxy
                        // รีเฟรช session ให้ก่อนถึงหน้านี้อยู่แล้ว
                    }
                },
            },
        },
    )
}