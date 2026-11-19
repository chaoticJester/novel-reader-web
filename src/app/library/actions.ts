'use server'

import { refresh } from 'next/cache'
import { getCurrentUser } from '@/lib/current-user'
import { createSupabaseServerClient } from '@/lib/supabase-server'

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export type LibraryResult = { error?: string }

export async function addToLibrary(novelId: string): Promise<LibraryResult> {
    if (typeof novelId !== 'string' || !UUID_PATTERN.test(novelId)) {
        return { error: 'ไม่พบนิยายเรื่องนี้' }
    }

    const user = await getCurrentUser()
    if (!user) {
        return { error: 'กรุณาเข้าสู่ระบบก่อน' }
    }

    const supabase = await createSupabaseServerClient()
    const { error } = await supabase
        .from('library_items')
        .upsert(
            { user_id: user.id, novel_id: novelId },
            { onConflict: 'user_id,novel_id', ignoreDuplicates: true }, // กดซ้ำ = ไม่ error
        )

    if (error) {
        console.error('addToLibrary failed:', error)
        return { error: 'เพิ่มเข้าชั้นหนังสือไม่สำเร็จ กรุณาลองใหม่' }
    }

    refresh()
    return {}
}

export async function removeFromLibrary(novelId: string): Promise<LibraryResult> {
    if (typeof novelId !== 'string' || !UUID_PATTERN.test(novelId)) {
        return { error: 'ไม่พบนิยายเรื่องนี้' }
    }

    const user = await getCurrentUser()
    if (!user) {
        return { error: 'กรุณาเข้าสู่ระบบก่อน' }
    }

    const supabase = await createSupabaseServerClient()
    const { error } = await supabase
        .from('library_items')
        .delete()
        .eq('user_id', user.id)
        .eq('novel_id', novelId)

    if (error) {
        console.error('removeFromLibrary failed:', error)
        return { error: 'นำออกจากชั้นหนังสือไม่สำเร็จ กรุณาลองใหม่' }
    }

    refresh() // หน้า /library จะได้เอาการ์ดเรื่องนี้ออก
    return {}
}

export type ProgressResult = { chapterIds: string[] } | { error: string }

// chapterNumber = null → ล้างความคืบหน้าของเรื่องนี้
export async function setReadingProgress(
    novelId: string,
    chapterNumber: number | null,
): Promise<ProgressResult> {
    if (typeof novelId !== 'string' || !UUID_PATTERN.test(novelId)) {
        return { error: 'ไม่พบนิยายเรื่องนี้' }
    }
    if (chapterNumber !== null && (typeof chapterNumber !== 'number' || !Number.isFinite(chapterNumber))) {
        return { error: 'เลขตอนไม่ถูกต้อง' }
    }

    const user = await getCurrentUser()
    if (!user) {
        return { error: 'กรุณาเข้าสู่ระบบก่อน' }
    }

    const supabase = await createSupabaseServerClient()
    const { data, error } = await supabase.rpc('set_reading_progress', {
        p_novel_id: novelId,
        p_chapter_number: chapterNumber,
    })

    if (error) {
        console.error('setReadingProgress failed:', error)
        return { error: 'บันทึกความคืบหน้าไม่สำเร็จ กรุณาลองใหม่' }
    }

    refresh() // ให้การ์ดโชว์ตัวเลขและแถบความคืบหน้าใหม่
    return { chapterIds: (data ?? []) as string[] }
}