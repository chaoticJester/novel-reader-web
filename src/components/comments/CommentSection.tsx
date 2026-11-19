import Avatar from '@/components/Avatar'
import RelativeTime from '@/components/RelativeTime'
import { COMMENTS_PAGE_SIZE, getComments, type CommentTarget } from '@/lib/comments'
import { Suspense } from 'react'
import CommentFormSlot from '@/components/comments/CommentFormSlot'

// สีใช้ currentColor + ความโปร่งใส: เข้ากับทั้งหน้านิยาย (dark) และหน้าอ่านที่เปลี่ยนธีมได้
// className: ระยะห่าง/เส้นคั่นด้านบน (หน้าอ่านมีพื้นดำแยกส่วนอยู่แล้ว จึงส่ง "" มา)
export default async function CommentSection({
    target,
    className = 'mt-10 border-t border-current/15 pt-6',
}: {
    target: CommentTarget
    className?: string
}) {
    const { comments, total } = await getComments(target)

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

            {comments.length === 0 ? (
                <p className="rounded-lg border border-dashed border-current/20 py-8 text-center text-sm opacity-60">
                    ยังไม่มีความคิดเห็น
                </p>
            ) : (
                <ul className="space-y-5">
                    {comments.map((comment) => {
                        const name = comment.author?.display_name ?? 'ผู้ใช้ที่ถูกลบ'
                        const edited = comment.updated_at !== comment.created_at

                        return (
                            <li key={comment.id} className="flex gap-3">
                                <Avatar name={name} url={comment.author?.avatar_url ?? null} size="md" />
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm">
                                        <span className="font-semibold">{name}</span>
                                        <span className="opacity-50">
                                            {' · '}
                                            <RelativeTime iso={comment.created_at} />
                                            {edited && ' · แก้ไขแล้ว'}
                                        </span>
                                    </p>
                                    <p className="mt-1 whitespace-pre-wrap break-words leading-relaxed">
                                        {comment.body}
                                    </p>
                                </div>
                            </li>
                        )
                    })}
                </ul>
            )}

            {total > COMMENTS_PAGE_SIZE && (
                <p className="mt-6 text-center text-sm opacity-60">
                    แสดง {COMMENTS_PAGE_SIZE} ความคิดเห็นล่าสุดจากทั้งหมด {total}
                </p>
            )}
        </section>
    )
}