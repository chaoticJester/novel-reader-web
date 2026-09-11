// app/api/revalidate-chapter/route.ts
import { revalidateTag } from 'next/cache'

export async function POST(req: Request) {
    const secret = req.headers.get('x-webhook-secret')
    if (secret !== process.env.REVALIDATE_SECRET) {
        return new Response('Unauthorized', { status: 401 })
    }

    const { id, novel_id } = await req.json()

    revalidateTag(`chapter-${id}`, 'max')        // เนื้อหาตอนที่แก้ไข
    revalidateTag(`novel-${novel_id}-toc`, 'max') // สารบัญของเรื่องนี้ (กรณีมีตอนใหม่/ลบตอน)

    return Response.json({ revalidated: true })
}