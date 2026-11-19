import 'server-only'

import { cacheLife, cacheTag } from 'next/cache'
import { supabase } from '@/lib/supabase' 

export const COMMENTS_PAGE_SIZE = 50

export type CommentTarget = { novelId: string; chapterId: string | null }

export type CommentItem = {
    id: string
    body: string
    created_at: string
    updated_at: string
    author: { display_name: string; avatar_url: string | null } | null
}

export const ALL_COMMENTS_TAG = 'comments'
export function commentsTag({ novelId, chapterId }: CommentTarget): string {
    return chapterId ? `comments-chapter-${chapterId}` : `comments-novel-${novelId}`
}

export async function getComments(target: CommentTarget) {
    'use cache'
    cacheTag(ALL_COMMENTS_TAG, commentsTag(target))
    cacheLife({ stale: 60, revalidate: 300, expire: 86400 })

    let query = supabase
        .from('comments')
        .select(
            'id, body, created_at, updated_at, author:profiles!comments_user_id_fkey(display_name, avatar_url)',
            { count: 'exact' },
        )
        .eq('novel_id', target.novelId)
        .is('hidden_at', null)
        .order('created_at', { ascending: false })
        .limit(COMMENTS_PAGE_SIZE)

    query = target.chapterId
        ? query.eq('chapter_id', target.chapterId)
        : query.is('chapter_id', null) 

    const { data, error, count } = await query

    if (error) {
        throw new Error(`โหลดคอมเมนต์ไม่สำเร็จ: ${error.message}`)
    }

    return { comments: (data ?? []) as unknown as CommentItem[], total: count ?? 0 }
}