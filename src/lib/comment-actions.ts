'use server'

import { updateTag } from 'next/cache'
import { getCurrentUser } from '@/lib/current-user'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { commentsTag, type CommentTarget } from '@/lib/comments'
import { MAX_COMMENT_LENGTH, commentLength } from '@/lib/comment-rules'

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export type CommentFormState = {
    error?: string
    success?: boolean
    body?: string 
}

function isValidTarget(target: CommentTarget): boolean {
    return (
        typeof target?.novelId === 'string' &&
        UUID_PATTERN.test(target.novelId) &&
        (target.chapterId === null ||
            (typeof target.chapterId === 'string' && UUID_PATTERN.test(target.chapterId)))
    )
}

export async function postComment(
    target: CommentTarget,
    _previousState: CommentFormState,
    formData: FormData,
): Promise<CommentFormState> {
    if (!isValidTarget(target)) {
        return { error: 'ไม่พบหน้าที่จะแสดงความคิดเห็น' }
    }

    const body = String(formData.get('body') ?? '').trim()

    const user = await getCurrentUser()
    if (!user) {
        return { error: 'กรุณาเข้าสู่ระบบก่อน', body }
    }

    const length = commentLength(body)
    if (length === 0) {
        return { error: 'กรุณาพิมพ์ความคิดเห็น', body }
    }
    if (length > MAX_COMMENT_LENGTH) {
        return { error: `ความคิดเห็นยาวได้ไม่เกิน ${MAX_COMMENT_LENGTH} ตัวอักษร`, body }
    }

    const supabase = await createSupabaseServerClient()
    const { error } = await supabase.from('comments').insert({
        novel_id: target.novelId,
        chapter_id: target.chapterId,
        user_id: user.id,
        body,
    })

    if (error) {
        switch (error.code) {
            case 'PT429': // trigger กันสแปม
                return { error: 'แสดงความคิดเห็นถี่เกินไป รอสักครู่แล้วลองใหม่', body }
            case '42501': // RLS: นิยายหรือตอนยังไม่เผยแพร่ / ถูกถอน
                return { error: 'ไม่สามารถแสดงความคิดเห็นในหน้านี้ได้', body }
            case '23514': // check constraint (ความยาว)
                return { error: `ความคิดเห็นต้องยาว 1–${MAX_COMMENT_LENGTH} ตัวอักษร`, body }
            default:
                console.error('postComment failed:', error)
                return { error: 'ส่งความคิดเห็นไม่สำเร็จ กรุณาลองใหม่', body }
        }
    }

    updateTag(commentsTag(target))
    return { success: true }
}