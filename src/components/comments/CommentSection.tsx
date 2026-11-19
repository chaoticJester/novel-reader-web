import Link from 'next/link'
import { Suspense } from 'react'
import CommentFormSlot from '@/components/comments/CommentFormSlot'
import CommentList from '@/components/comments/CommentList'
import CommentListWithViewer from '@/components/comments/CommentListWithViewer'
import LoadMoreLabel from '@/components/comments/LoadMoreLabel'
import { MAX_COMMENT_PAGES, parseCommentPages } from '@/lib/comment-rules'
import { COMMENTS_PAGE_SIZE, getComments, type CommentTarget } from '@/lib/comments'

// สีใช้ currentColor + ความโปร่งใส: เข้ากับทั้งหน้านิยาย (dark) และหน้าอ่านที่เปลี่ยนธีมได้
// className: ระยะห่าง/เส้นคั่นด้านบน (หน้าอ่านมีพื้นดำแยกส่วนอยู่แล้ว จึงส่ง "" มา)
export default async function CommentSection({
    target,
    className = 'mt-10 border-t border-current/15 pt-6',
    searchParams,
}: {
    target: CommentTarget
    className?: string
    // ส่งเป็น Promise มาจาก page: await ตรงนี้ (ใน Suspense) เฉพาะส่วนคอมเมนต์จึงต้องรอ request
    searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
    const pages = parseCommentPages((await searchParams)?.comments)
    const { threads, total, rootTotal, hasMore } = await getComments(target, pages)

    const here = target.chapterId
        ? `/novel/${target.novelId}/chapter/${target.chapterId}`
        : `/novel/${target.novelId}`

    return (
        <section aria-labelledby="comments-heading" className={className}>
            <h2 id="comments-heading" className="mb-4 text-xl font-bold">
                ความคิดเห็น <span className="text-base font-normal opacity-60">({total})</span>
            </h2>

            <div className="mb-6">
                <Suspense fallback={<div className="h-24 animate-pulse rounded-lg bg-current/5" />}>
                    <CommentFormSlot target={target} />
                </Suspense>
            </div>

            {/* fallback = รายการเดียวกันแต่ยังไม่มีปุ่ม: เห็นคอมเมนต์ได้ทันทีจาก static shell */}
            <Suspense fallback={<CommentList threads={threads} viewer={null} />}>
                <CommentListWithViewer threads={threads} />
            </Suspense>

            {/* ?comments=N ใน URL: server render ทุกหน้าที่โหลดแล้ว แก้/ลบ/โพสต์แล้วข้อมูลจึงตรงเสมอ */}
            {hasMore && pages < MAX_COMMENT_PAGES && (
                <div className="mt-6 text-center">
                    <Link
                        href={`${here}?comments=${pages + 1}`}
                        scroll={false} // อยู่ตำแหน่งเดิม ไม่เด้งกลับขึ้นบนสุดของหน้า
                        replace        // กดย้อนกลับแล้วออกจากหน้า ไม่ต้องย้อนทีละหน้าคอมเมนต์
                        className="inline-block rounded-lg border border-current/20 px-5 py-2 text-sm transition hover:bg-white/5"
                    >
                        <LoadMoreLabel />
                    </Link>
                    <p className="mt-2 text-xs opacity-50">
                        แสดง {Math.min(pages * COMMENTS_PAGE_SIZE, rootTotal)} จาก {rootTotal} ความคิดเห็น
                    </p>
                </div>
            )}

            {hasMore && pages >= MAX_COMMENT_PAGES && (
                <p className="mt-6 text-center text-sm opacity-60">
                    แสดงได้สูงสุด {MAX_COMMENT_PAGES * COMMENTS_PAGE_SIZE} ความคิดเห็นล่าสุด
                </p>
            )}
        </section>
    )
}