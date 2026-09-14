// app/api/revalidate-chapter/route.ts
import { revalidateTag } from 'next/cache'

export async function POST(req: Request) {
    const secret = req.headers.get('x-webhook-secret')
    if (secret !== process.env.REVALIDATE_SECRET) {
        return new Response('Unauthorized', { status: 401 })
    }

    const payload = await req.json()
    // รองรับทั้ง webhook (record/old_record) และ body ตรงๆ
    // INSERT/UPDATE ใช้ record, DELETE ใช้ old_record
    const record = payload.record ?? payload.old_record ?? payload
    const { id, novel_id } = record

    if (!id || !novel_id) {
        return Response.json({ revalidated: false, error: 'missing id/novel_id', payload }, { status: 400 })
    }

    revalidateTag(`chapter-${id}`)        // เนื้อหาตอนที่แก้ไข
    revalidateTag(`novel-${novel_id}-toc`) // สารบัญ + ปุ่มตอนก่อนหน้า/ถัดไป (ตอนใหม่/ลบตอน)
    return Response.json({ revalidated: true, id, novel_id })
}
