import 'server-only'

import { cache } from 'react'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export type UserRole = 'reader' | 'admin'

export type CurrentUser = {
    id: string
    displayName: string
    role: UserRole
}

// cache() ของ React: ใน request เดียวกัน ถ้าเรียกหลายครั้ง
// (เช่น Navbar + ฟอร์มคอมเมนต์) จะ query จริงแค่ครั้งเดียว
// ไม่เกี่ยวกับ 'use cache' (ซึ่งเก็บข้ามหลาย request และหลายผู้ใช้)
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
    const supabase = await createSupabaseServerClient()

    // ห้ามใช้ getSession() ตัดสินสิทธิ์ฝั่ง server เพราะไม่ได้ตรวจลายเซ็น
    const { data, error } = await supabase.auth.getClaims()
    const userId = data?.claims?.sub

    if (error || !userId) {
        return null
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('display_name, role')
        .eq('id', userId)
        .maybeSingle()

    if (!profile) {
        return null
    }

    return {
        id: userId,
        displayName: profile.display_name,
        role: profile.role as UserRole,
    }
})