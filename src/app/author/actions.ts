'use server'

import { updateTag } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireAuthorSession } from '@/lib/author-session'
import { supabaseAdmin } from '@/lib/supabase-admin'
import {
    parseChapterForm,
    parseNovelForm,
    parseTagNames,
    type TagInput,
} from '@/lib/author-validation'
import {
    getCoverFile,
    removeManagedCover,
    uploadCover,
} from '@/lib/cover-storage'

// Make the novel's tags exactly match `tags`:
// 1. create any tags that don't exist yet
// 2. remove links to tags that were taken out
// 3. add links to the new tags
async function syncNovelTags(novelId: string, tags: TagInput[]) {
    let tagIds: number[] = []

    if (tags.length > 0) {
        const { error: insertError } = await supabaseAdmin
            .from('tags')
            .upsert(tags, { onConflict: 'slug', ignoreDuplicates: true })

        if (insertError) {
            throw new Error(`บันทึกแท็กไม่สำเร็จ: ${insertError.message}`)
        }

        const { data: tagRows, error: lookupError } = await supabaseAdmin
            .from('tags')
            .select('id')
            .in('slug', tags.map((t) => t.slug))

        if (lookupError) {
            throw new Error(`ค้นหาแท็กไม่สำเร็จ: ${lookupError.message}`)
        }

        tagIds = tagRows.map((row) => row.id)
    }

    let removeQuery = supabaseAdmin
        .from('novel_tags')
        .delete()
        .eq('novel_id', novelId)

    if (tagIds.length > 0) {
        removeQuery = removeQuery.not('tag_id', 'in', `(${tagIds.join(',')})`)
    }

    const { error: removeError } = await removeQuery

    if (removeError) {
        throw new Error(`ลบแท็กเดิมไม่สำเร็จ: ${removeError.message}`)
    }

    if (tagIds.length > 0) {
        const { error: linkError } = await supabaseAdmin
            .from('novel_tags')
            .upsert(
                tagIds.map((tagId) => ({ novel_id: novelId, tag_id: tagId })),
                { onConflict: 'novel_id,tag_id', ignoreDuplicates: true },
            )

        if (linkError) {
            throw new Error(`เชื่อมแท็กกับนิยายไม่สำเร็จ: ${linkError.message}`)
        }
    }
}

export async function createNovel(formData: FormData) {
    await requireAuthorSession()

    const values = parseNovelForm(formData)
    const tags = parseTagNames(formData)
    const coverFile = getCoverFile(formData)
    const coverImageUrl = coverFile ? await uploadCover(coverFile) : null

    const { data, error } = await supabaseAdmin
        .from('novels')
        .insert({
            ...values,
            cover_image_url: coverImageUrl,
        })
        .select('id')
        .single()

    if (error) {
        await removeManagedCover(coverImageUrl)
        throw new Error(`สร้างนิยายไม่สำเร็จ: ${error.message}`)
    }

    await syncNovelTags(data.id, tags)

    updateTag('novels-list')
    redirect(`/author/novels/${data.id}/edit`)
}

export async function updateNovel(
    novelId: string,
    formData: FormData,
) {
    await requireAuthorSession()

    const values = parseNovelForm(formData)
    const tags = parseTagNames(formData)
    const coverFile = getCoverFile(formData)
    const { data: existingNovel, error: lookupError } = await supabaseAdmin
        .from('novels')
        .select('cover_image_url')
        .eq('id', novelId)
        .single()

    if (lookupError) {
        throw new Error(`ไม่พบข้อมูลนิยาย: ${lookupError.message}`)
    }

    const newCoverUrl = coverFile ? await uploadCover(coverFile) : null

    const { error } = await supabaseAdmin
        .from('novels')
        .update({
            ...values,
            ...(newCoverUrl ? { cover_image_url: newCoverUrl } : {}),
        })
        .eq('id', novelId)

    if (error) {
        await removeManagedCover(newCoverUrl)
        throw new Error(`แก้ไขนิยายไม่สำเร็จ: ${error.message}`)
    }

    if (newCoverUrl) {
        await removeManagedCover(existingNovel.cover_image_url)
    }

    await syncNovelTags(novelId, tags)

    updateTag('novels-list')
    updateTag(`novel-${novelId}`)
    redirect('/author')
}

export async function deleteNovel(novelId: string) {
    await requireAuthorSession()

    const { data: existingNovel, error: lookupError } = await supabaseAdmin
        .from('novels')
        .select('cover_image_url')
        .eq('id', novelId)
        .single()

    if (lookupError) {
        throw new Error(`ไม่พบข้อมูลนิยาย: ${lookupError.message}`)
    }

    const { error } = await supabaseAdmin
        .from('novels')
        .delete()
        .eq('id', novelId)

    if (error) {
        throw new Error(`ลบนิยายไม่สำเร็จ: ${error.message}`)
    }

    await removeManagedCover(existingNovel.cover_image_url)

    updateTag('novels-list')
    updateTag(`novel-${novelId}`)
    updateTag(`novel-${novelId}-toc`)
    redirect('/author')
}

export async function createChapter(
    novelId: string,
    formData: FormData,
) {
    await requireAuthorSession()

    const values = parseChapterForm(formData)

    const { data, error } = await supabaseAdmin
        .from('chapters')
        .insert({
            ...values,
            novel_id: novelId,
        })
        .select('id')
        .single()

    if (error) {
        throw new Error(`สร้างตอนไม่สำเร็จ: ${error.message}`)
    }

    updateTag('novels-list')
    updateTag(`novel-${novelId}-toc`)
    updateTag(`chapter-${data.id}`)

    redirect(`/author/novels/${novelId}/edit`)
}

export async function updateChapter(
    novelId: string,
    chapterId: string,
    formData: FormData,
) {
    await requireAuthorSession()

    const values = parseChapterForm(formData)

    const { error } = await supabaseAdmin
        .from('chapters')
        .update(values)
        .eq('id', chapterId)
        .eq('novel_id', novelId)

    if (error) {
        throw new Error(`แก้ไขตอนไม่สำเร็จ: ${error.message}`)
    }

    updateTag('novels-list')
    updateTag(`novel-${novelId}-toc`)
    updateTag(`chapter-${chapterId}`)

    redirect(`/author/novels/${novelId}/edit`)
}

export async function deleteChapter(
    novelId: string,
    chapterId: string,
) {
    await requireAuthorSession()

    const { error } = await supabaseAdmin
        .from('chapters')
        .delete()
        .eq('id', chapterId)
        .eq('novel_id', novelId)

    if (error) {
        throw new Error(`ลบตอนไม่สำเร็จ: ${error.message}`)
    }

    updateTag('novels-list')
    updateTag(`novel-${novelId}-toc`)
    updateTag(`chapter-${chapterId}`)

    redirect(`/author/novels/${novelId}/edit`)
}
