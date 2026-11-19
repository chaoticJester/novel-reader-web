import 'server-only'

import { cacheLife, cacheTag } from 'next/cache'
import { supabase } from '@/lib/supabase' // anon client: ได้ผลแบบที่ "ทุกคนเห็น" จึง cache ร่วมกันได้

export const COMMENTS_PAGE_SIZE = 50

export type CommentTarget = { novelId: string; chapterId: string | null }

export type CommentItem = {
    id: string
    user_id: string
    parent_id: string | null
    body: string
    created_at: string
    updated_at: string
    author: { display_name: string; avatar_url: string | null } | null
}

export type CommentThread = CommentItem & { replies: CommentItem[] }

export const ALL_COMMENTS_TAG = 'comments'
export function commentsTag({ novelId, chapterId }: CommentTarget): string {
    return chapterId ? `comments-chapter-${chapterId}` : `comments-novel-${novelId}`
}

const COMMENT_COLUMNS =
    'id, user_id, parent_id, body, created_at, updated_at, author:profiles!comments_user_id_fkey(display_name, avatar_url)'

// คอมเมนต์ที่มองเห็นได้ของหน้านี้ (ใช้เป็นฐานของทุก query ด้านล่าง)
function visibleIn(target: CommentTarget, columns: string, options?: { count: 'exact'; head?: boolean }) {
    const query = supabase
        .from('comments')
        .select(columns, options)
        .eq('novel_id', target.novelId)
        .is('hidden_at', null)

    return target.chapterId ? query.eq('chapter_id', target.chapterId) : query.is('chapter_id', null)
}

// pages เป็นส่วนหนึ่งของ cache key เอง แต่ใช้ tag เดียวกัน: updateTag ครั้งเดียวล้างทุกจำนวนหน้า
export async function getComments(target: CommentTarget, pages = 1) {
    'use cache'
    cacheTag(ALL_COMMENTS_TAG, commentsTag(target))
    cacheLife({ stale: 60, revalidate: 300, expire: 86400 })

    const limit = COMMENTS_PAGE_SIZE * pages

    // 1) คอมเมนต์หลัก (เกินมา 1 ตัวไว้ดูว่ามีหน้าถัดไปไหม) + จำนวนทั้งหมด (รวมการตอบกลับ) พร้อมกัน
    const [rootsRes, totalRes] = await Promise.all([
        visibleIn(target, COMMENT_COLUMNS, { count: 'exact' })
            .is('parent_id', null)
            .order('created_at', { ascending: false })
            .limit(limit + 1),
        visibleIn(target, 'id', { count: 'exact', head: true }), // head: นับอย่างเดียว ไม่ส่งแถวกลับมา
    ])

    if (rootsRes.error) throw new Error(`โหลดคอมเมนต์ไม่สำเร็จ: ${rootsRes.error.message}`)
    if (totalRes.error) throw new Error(`นับคอมเมนต์ไม่สำเร็จ: ${totalRes.error.message}`)

    const rows = (rootsRes.data ?? []) as unknown as CommentItem[]
    const hasMore = rows.length > limit
    const roots = rows.slice(0, limit)

    // 2) การตอบกลับของคอมเมนต์หลักชุดนี้ (query เดียว ไม่ต้องวนทีละตัว)
    let replies: CommentItem[] = []
    if (roots.length > 0) {
        const repliesRes = await visibleIn(target, COMMENT_COLUMNS)
            .in('parent_id', roots.map((root) => root.id))
            .order('created_at', { ascending: true }) // อ่านการตอบกลับจากเก่าไปใหม่เหมือนบทสนทนา

        if (repliesRes.error) throw new Error(`โหลดการตอบกลับไม่สำเร็จ: ${repliesRes.error.message}`)
        replies = (repliesRes.data ?? []) as unknown as CommentItem[]
    }

    // 3) จัดกลุ่มการตอบกลับเข้ากับคอมเมนต์หลัก
    const repliesByParent = new Map<string, CommentItem[]>()
    for (const reply of replies) {
        const list = repliesByParent.get(reply.parent_id!) ?? []
        list.push(reply)
        repliesByParent.set(reply.parent_id!, list)
    }

    const threads: CommentThread[] = roots.map((root) => ({
        ...root,
        replies: repliesByParent.get(root.id) ?? [],
    }))

    return { threads, total: totalRes.count ?? 0, rootTotal: rootsRes.count ?? 0, hasMore }
}