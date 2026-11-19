'use server'

import { updateTag } from 'next/cache'
import { getCurrentUser } from '@/lib/current-user'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { commentsTag, type CommentTarget } from '@/lib/comments'
import { MAX_COMMENT_LENGTH, commentLength } from '@/lib/comment-rules'
import { supabaseAdmin } from '@/lib/supabase-admin'

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

// error จากการ insert คอมเมนต์ (ทั้งคอมเมนต์หลักและการตอบกลับ) → ข้อความสำหรับผู้ใช้
function insertErrorMessage(error: { code: string }): string {
    switch (error.code) {
        case 'PT429':
            return 'แสดงความคิดเห็นถี่เกินไป รอสักครู่แล้วลองใหม่'
        case '42501':
            return 'ไม่สามารถแสดงความคิดเห็นในหน้านี้ได้'
        case '23514':
            return `ความคิดเห็นต้องยาว 1–${MAX_COMMENT_LENGTH} ตัวอักษร`
        case '23503':
        case '22023':
            return 'ตอบกลับความคิดเห็นนี้ไม่ได้ (อาจถูกลบหรือซ่อนไปแล้ว)'
        default:
            console.error('comment insert failed:', error)
            return 'ส่งความคิดเห็นไม่สำเร็จ กรุณาลองใหม่'
    }
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
        return { error: insertErrorMessage(error), body }
    }

    updateTag(commentsTag(target))
    return { success: true }
}

export type CommentActionResult = { error?: string }

type CommentRow = { novel_id: string; chapter_id: string | null }

// แปลงแถวที่ได้กลับมาเป็น target สำหรับล้าง cache ให้ถูกหน้า
function targetOf(row: CommentRow): CommentTarget {
    return { novelId: row.novel_id, chapterId: row.chapter_id }
}

// เจ้าของเท่านั้น 
export async function editComment(commentId: string, rawBody: string): Promise<CommentActionResult> {
    if (typeof commentId !== 'string' || !UUID_PATTERN.test(commentId)) {
        return { error: 'ไม่พบความคิดเห็นนี้' }
    }

    const body = String(rawBody ?? '').trim()
    const length = commentLength(body)
    if (length === 0 || length > MAX_COMMENT_LENGTH) {
        return { error: `ความคิดเห็นต้องยาว 1–${MAX_COMMENT_LENGTH} ตัวอักษร` }
    }

    const user = await getCurrentUser()
    if (!user) {
        return { error: 'กรุณาเข้าสู่ระบบก่อน' }
    }

    const supabase = await createSupabaseServerClient()
    const { data, error } = await supabase
        .from('comments')
        .update({ body })
        .eq('id', commentId)
        .eq('user_id', user.id) // RLS กันอยู่แล้ว ใส่ไว้ให้อ่านโค้ดแล้วเข้าใจเจตนา
        .select('novel_id, chapter_id')

    if (error) {
        console.error('editComment failed:', error)
        return { error: 'บันทึกไม่สำเร็จ กรุณาลองใหม่' }
    }
    // RLS ไม่ให้แก้ = ไม่ error แต่ได้ 0 แถว
    if (data.length === 0) {
        return { error: 'แก้ไขความคิดเห็นนี้ไม่ได้' }
    }

    updateTag(commentsTag(targetOf(data[0])))
    return {}
}

// เจ้าของ หรือ admin 
export async function deleteComment(commentId: string): Promise<CommentActionResult> {
    if (typeof commentId !== 'string' || !UUID_PATTERN.test(commentId)) {
        return { error: 'ไม่พบความคิดเห็นนี้' }
    }

    const user = await getCurrentUser()
    if (!user) {
        return { error: 'กรุณาเข้าสู่ระบบก่อน' }
    }

    const supabase = await createSupabaseServerClient()
    const { data, error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId)
        .select('novel_id, chapter_id')

    if (error) {
        console.error('deleteComment failed:', error)
        return { error: 'ลบไม่สำเร็จ กรุณาลองใหม่' }
    }
    if (data.length === 0) {
        return { error: 'ลบความคิดเห็นนี้ไม่ได้' }
    }

    updateTag(commentsTag(targetOf(data[0])))
    return {}
}

// admin
export async function hideComment(commentId: string): Promise<CommentActionResult> {
    if (typeof commentId !== 'string' || !UUID_PATTERN.test(commentId)) {
        return { error: 'ไม่พบความคิดเห็นนี้' }
    }

    const user = await getCurrentUser()
    if (user?.role !== 'admin') {
        return { error: 'ไม่มีสิทธิ์ซ่อนความคิดเห็น' }
    }

    const { data, error } = await supabaseAdmin
        .from('comments')
        .update({ hidden_at: new Date().toISOString(), hidden_by: user.id })
        .eq('id', commentId)
        .is('hidden_at', null) // ซ่อนไปแล้วไม่ทับ (เก็บว่าใครซ่อนคนแรก)
        .select('novel_id, chapter_id')

    if (error) {
        console.error('hideComment failed:', error)
        return { error: 'ซ่อนไม่สำเร็จ กรุณาลองใหม่' }
    }
    if (data.length === 0) {
        return { error: 'ความคิดเห็นนี้ถูกซ่อนหรือลบไปแล้ว' }
    }

    updateTag(commentsTag(targetOf(data[0])))
    return {}
}

// ตอบกลับ: หาหน้าและคอมเมนต์หลักจาก DB เอง ไม่เชื่อค่าจาก client
export async function postReply(
    parentId: string,
    _previousState: CommentFormState,
    formData: FormData,
): Promise<CommentFormState> {
    const body = String(formData.get('body') ?? '').trim()

    if (typeof parentId !== 'string' || !UUID_PATTERN.test(parentId)) {
        return { error: 'ไม่พบความคิดเห็นที่จะตอบกลับ', body }
    }

    const user = await getCurrentUser()
    if (!user) {
        return { error: 'กรุณาเข้าสู่ระบบก่อน', body }
    }

    const length = commentLength(body)
    if (length === 0 || length > MAX_COMMENT_LENGTH) {
        return { error: `ความคิดเห็นต้องยาว 1–${MAX_COMMENT_LENGTH} ตัวอักษร`, body }
    }

    const supabase = await createSupabaseServerClient()
    const { data: parent } = await supabase
        .from('comments')
        .select('id, novel_id, chapter_id, parent_id')
        .eq('id', parentId)
        .maybeSingle() // RLS: ถูกซ่อนหรือหน้าถูกถอน = มองไม่เห็น = null

    if (!parent) {
        return { error: 'ความคิดเห็นที่จะตอบกลับถูกลบหรือซ่อนไปแล้ว', body }
    }

    // ตอบ "การตอบกลับ" → ไปต่อใต้คอมเมนต์หลักแทน (ซ้อนแค่ชั้นเดียว)
    const rootId = parent.parent_id ?? parent.id

    const { error } = await supabase.from('comments').insert({
        novel_id: parent.novel_id,
        chapter_id: parent.chapter_id,
        user_id: user.id,
        parent_id: rootId,
        body,
    })

    if (error) {
        return { error: insertErrorMessage(error), body }
    }

    updateTag(commentsTag(targetOf(parent)))
    return { success: true }
}