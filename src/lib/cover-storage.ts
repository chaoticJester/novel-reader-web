import 'server-only'

import { randomUUID } from 'node:crypto'
import { supabaseAdmin } from '@/lib/supabase-admin'

const COVER_BUCKET = 'novel-covers'
const MAX_COVER_SIZE = 5 * 1024 * 1024

const EXTENSIONS: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
}

async function ensureCoverBucket(): Promise<void> {
    const { data } = await supabaseAdmin.storage.getBucket(COVER_BUCKET)

    if (data) return

    const { error } = await supabaseAdmin.storage.createBucket(COVER_BUCKET, {
        public: true,
        fileSizeLimit: MAX_COVER_SIZE,
        allowedMimeTypes: Object.keys(EXTENSIONS),
    })

    // Another simultaneous request may have created it first.
    if (error && !error.message.toLowerCase().includes('already exists')) {
        throw new Error(`สร้างพื้นที่เก็บรูปปกไม่สำเร็จ: ${error.message}`)
    }
}

export function getCoverFile(formData: FormData): File | null {
    const value = formData.get('cover_image')

    if (!(value instanceof File) || value.size === 0) {
        return null
    }

    if (!EXTENSIONS[value.type]) {
        throw new Error('รูปปกต้องเป็นไฟล์ JPG, PNG หรือ WebP')
    }

    if (value.size > MAX_COVER_SIZE) {
        throw new Error('รูปปกต้องมีขนาดไม่เกิน 5 MB')
    }

    return value
}

export async function uploadCover(file: File): Promise<string> {
    await ensureCoverBucket()

    const extension = EXTENSIONS[file.type]
    const path = `covers/${randomUUID()}.${extension}`

    const { error } = await supabaseAdmin.storage
        .from(COVER_BUCKET)
        .upload(path, await file.arrayBuffer(), {
            contentType: file.type,
            cacheControl: '31536000',
            upsert: false,
        })

    if (error) {
        throw new Error(`อัปโหลดรูปปกไม่สำเร็จ: ${error.message}`)
    }

    const { data } = supabaseAdmin.storage
        .from(COVER_BUCKET)
        .getPublicUrl(path)

    return data.publicUrl
}

function getManagedCoverPath(url: string | null): string | null {
    if (!url) return null

    const marker = `/storage/v1/object/public/${COVER_BUCKET}/`
    const markerIndex = url.indexOf(marker)

    if (markerIndex === -1) return null

    const encodedPath = url.slice(markerIndex + marker.length).split('?')[0]

    try {
        return decodeURIComponent(encodedPath)
    } catch {
        return null
    }
}

export async function removeManagedCover(url: string | null): Promise<void> {
    const path = getManagedCoverPath(url)
    if (!path) return

    const { error } = await supabaseAdmin.storage
        .from(COVER_BUCKET)
        .remove([path])

    if (error) {
        console.error('Failed to remove cover from Supabase Storage:', error)
    }
}
