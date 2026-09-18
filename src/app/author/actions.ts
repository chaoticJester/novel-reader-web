'use server'

import { revalidateTag } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireAuthorSession } from '@/lib/author-session'
import { supabaseAdmin } from '@/lib/supabase-admin'
import {
    parseChapterForm,
    parseNovelForm,
} from '@/lib/author-validation'
import {
    getCoverFile,
    removeManagedCover,
    uploadCover,
} from '@/lib/cover-storage'

export async function createNovel(formData: FormData) {
    await requireAuthorSession()

    const values = parseNovelForm(formData)
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

    revalidateTag('novels-list', 'max')
    redirect(`/author/novels/${data.id}/edit`)
}

export async function updateNovel(
    novelId: string,
    formData: FormData,
) {
    await requireAuthorSession()

    const values = parseNovelForm(formData)
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

    revalidateTag('novels-list', 'max')
    revalidateTag(`novel-${novelId}`, 'max')
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

    revalidateTag('novels-list', 'max')
    revalidateTag(`novel-${novelId}`, 'max')
    revalidateTag(`novel-${novelId}-toc`, 'max')
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

    revalidateTag('novels-list', 'max')
    revalidateTag(`novel-${novelId}-toc`, 'max')
    revalidateTag(`chapter-${data.id}`, 'max')

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

    revalidateTag('novels-list', 'max')
    revalidateTag(`novel-${novelId}-toc`, 'max')
    revalidateTag(`chapter-${chapterId}`, 'max')

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

    revalidateTag('novels-list', 'max')
    revalidateTag(`novel-${novelId}-toc`, 'max')
    revalidateTag(`chapter-${chapterId}`, 'max')

    redirect(`/author/novels/${novelId}/edit`)
}
