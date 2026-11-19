import 'server-only'

import { randomUUID } from 'node:crypto'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { AVATAR_EXTENSIONS, MAX_AVATAR_SIZE } from '@/lib/avatar-rules'
import sharp from 'sharp'

const AVATAR_PX = 256 // 3 เท่าของขนาดใหญ่สุดที่แสดง (80px) ชัดพอบนจอ retina

const AVATAR_BUCKET = 'avatars'

async function ensureAvatarBucket(): Promise<void> {
    const { data } = await supabaseAdmin.storage.getBucket(AVATAR_BUCKET)
    if (data) return

    const { error } = await supabaseAdmin.storage.createBucket(AVATAR_BUCKET, {
        public: true,
        fileSizeLimit: MAX_AVATAR_SIZE,
        allowedMimeTypes: Object.keys(AVATAR_EXTENSIONS),
    })

    if (error && !error.message.toLowerCase().includes('already exists')) {
        throw new Error(`สร้างพื้นที่เก็บรูปโปรไฟล์ไม่สำเร็จ: ${error.message}`)
    }
}

export function validateAvatarFile(value: FormDataEntryValue | null): { file: File } | { error: string } {
    if (!(value instanceof File) || value.size === 0) {
        return { error: 'กรุณาเลือกรูป' }
    }
    if (!AVATAR_EXTENSIONS[value.type]) {
        return { error: 'รูปต้องเป็นไฟล์ JPG, PNG หรือ WebP' }
    }
    if (value.size > MAX_AVATAR_SIZE) {
        return { error: 'รูปต้องมีขนาดไม่เกิน 2 MB' }
    }
    return { file: value }
}

export async function resizeAvatar(file: File): Promise<Buffer> {
    const input = Buffer.from(await file.arrayBuffer())

    return sharp(input, { limitInputPixels: 40_000_000 }) 
        .rotate()                                         
        .resize(AVATAR_PX, AVATAR_PX, { fit: 'cover' })   
        .webp({ quality: 82 })
        .toBuffer()
}

export async function uploadAvatar(userId: string, image: Buffer): Promise<string> {
    await ensureAvatarBucket()

    // ชื่อสุ่มใหม่ทุกครั้ง → URL เปลี่ยน เบราว์เซอร์ไม่ติด cache รูปเก่า
    const path = `${userId}/${randomUUID()}.webp`

    const { error } = await supabaseAdmin.storage
        .from(AVATAR_BUCKET)
        .upload(path, image, {
            contentType: 'image/webp',
            cacheControl: '31536000',
            upsert: false,
        })

    if (error) {
        throw new Error(`อัปโหลดรูปโปรไฟล์ไม่สำเร็จ: ${error.message}`)
    }

    return supabaseAdmin.storage.from(AVATAR_BUCKET).getPublicUrl(path).data.publicUrl
}

export async function removeManagedAvatar(userId: string, url: string | null): Promise<void> {
    if (!url) return

    const marker = `/storage/v1/object/public/${AVATAR_BUCKET}/`
    const index = url.indexOf(marker)
    if (index === -1) return

    let path: string
    try {
        path = decodeURIComponent(url.slice(index + marker.length).split('?')[0])
    } catch {
        return
    }

    if (!path.startsWith(`${userId}/`)) return

    const { error } = await supabaseAdmin.storage.from(AVATAR_BUCKET).remove([path])
    if (error) {
        console.error('Failed to remove avatar:', error)
    }
}