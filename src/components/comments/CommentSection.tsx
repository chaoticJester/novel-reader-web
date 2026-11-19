import { Suspense } from 'react'
import CommentFormSlot from '@/components/comments/CommentFormSlot'
import CommentList from '@/components/comments/CommentList'
import CommentListWithViewer from '@/components/comments/CommentListWithViewer'
import { COMMENTS_PAGE_SIZE, getComments, type CommentTarget } from '@/lib/comments'

// สีใช้ currentColor + ความโปร่งใส: เข้ากับทั้งหน้านิยาย (dark) และหน้าอ่านที่เปลี่ยนธีมได้
// className: ระยะห่าง/เส้นคั่นด้านบน (หน้าอ่านมีพื้นดำแยกส่วนอยู่แล้ว จึงส่ง "" มา)
export default async function CommentSection({
    target,
    className = 'mt-10 border-t border-current/15 pt-6',
}: {
    target: CommentTarget
    className?: string
}) {
    const { threads, total, rootTotal } = await getComments(target)

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

            {/* จำกัดที่คอมเมนต์หลัก (การตอบกลับไม่นับรวมใน 50) */}
            {rootTotal > COMMENTS_PAGE_SIZE && (
                <p className="mt-6 text-center text-sm opacity-60">
                    แสดง {COMMENTS_PAGE_SIZE} ความคิดเห็นล่าสุดจากทั้งหมด {rootTotal}
                </p>
            )}
        </section>
    )
}