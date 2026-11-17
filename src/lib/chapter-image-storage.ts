import 'server-only'

import { randomUUID } from 'node:crypto'
import { supabaseAdmin } from '@/lib/supabase-admin'

const CHAPTER_IMAGE_BUCKET = 'chapter-images'
export const MAX_CHAPTER_IMAGE_SIZE = 5 * 1024 * 1024

const EXTENSIONS: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
}

async function ensureChapterImageBucket(): Promise<void> {
    const { data } = await supabaseAdmin.storage.getBucket(CHAPTER_IMAGE_BUCKET)

    if (data) return

    const { error } = await supabaseAdmin.storage.createBucket(CHAPTER_IMAGE_BUCKET, {
        public: true,
        fileSizeLimit: MAX_CHAPTER_IMAGE_SIZE,
        allowedMimeTypes: Object.keys(EXTENSIONS),
    })

    // Another simultaneous request may have created it first.
    if (error && !error.message.toLowerCase().includes('already exists')) {
        throw new Error(`สร้างพื้นที่เก็บรูปประกอบไม่สำเร็จ: ${error.message}`)
    }
}

// Returns an error message, or null when the file is acceptable.
export function validateChapterImage(value: FormDataEntryValue | null): string | null {
    if (!(value instanceof File) || value.size === 0) {
        return 'กรุณาเลือกไฟล์รูป'
    }

    if (!EXTENSIONS[value.type]) {
        return 'รูปประกอบต้องเป็นไฟล์ JPG, PNG, WebP หรือ GIF'
    }

    if (value.size > MAX_CHAPTER_IMAGE_SIZE) {
        return 'รูปประกอบต้องมีขนาดไม่เกิน 5 MB'
    }

    return null
}

export async function uploadChapterImage(novelId: string, file: File): Promise<string> {
    await ensureChapterImageBucket()

    const extension = EXTENSIONS[file.type]
    const path = `${novelId}/${randomUUID()}.${extension}`

    const { error } = await supabaseAdmin.storage
        .from(CHAPTER_IMAGE_BUCKET)
        .upload(path, await file.arrayBuffer(), {
            contentType: file.type,
            cacheControl: '31536000',
            upsert: false,
        })

    if (error) {
        throw new Error(`อัปโหลดรูปประกอบไม่สำเร็จ: ${error.message}`)
    }

    const { data } = supabaseAdmin.storage
        .from(CHAPTER_IMAGE_BUCKET)
        .getPublicUrl(path)

    return data.publicUrl
}
