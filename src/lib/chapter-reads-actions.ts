'use server'

import { getCurrentUser } from '@/lib/current-user'
import { createSupabaseServerClient } from '@/lib/supabase-server'

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const MAX_IMPORT = 5000
const PAGE_SIZE = 1000 

export type ReadsByNovel = Record<string, string[]>

export async function markChapterRead(chapterId: string): Promise<boolean> {
    if (typeof chapterId !== 'string' || !UUID_PATTERN.test(chapterId)) return false

    const user = await getCurrentUser()
    if (!user) return false

    const supabase = await createSupabaseServerClient()
    const { error } = await supabase.rpc('import_chapter_reads', { p_chapter_ids: [chapterId] })

    if (error) {
        console.error('markChapterRead failed:', error)
        return false
    }
    return true
}


export async function syncChapterReads(localChapterIds: string[]): Promise<ReadsByNovel | null> {
    const user = await getCurrentUser()
    if (!user || !Array.isArray(localChapterIds)) return null

    const ids = [
        ...new Set(localChapterIds.filter((id) => typeof id === 'string' && UUID_PATTERN.test(id))),
    ].slice(0, MAX_IMPORT)

    const supabase = await createSupabaseServerClient()

    if (ids.length > 0) {
        const { error } = await supabase.rpc('import_chapter_reads', { p_chapter_ids: ids })
        if (error) {
            console.error('syncChapterReads import failed:', error)
            return null
        }
    }

    const result: ReadsByNovel = {}
    for (let from = 0; ; from += PAGE_SIZE) {
        const { data, error } = await supabase
            .from('chapter_reads')
            .select('novel_id, chapter_id')
            .order('chapter_id') 
            .range(from, from + PAGE_SIZE - 1)

        if (error) {
            console.error('syncChapterReads fetch failed:', error)
            return null
        }

        for (const row of data) {
            ;(result[row.novel_id] ??= []).push(row.chapter_id)
        }

        if (data.length < PAGE_SIZE) break
    }

    return result
}