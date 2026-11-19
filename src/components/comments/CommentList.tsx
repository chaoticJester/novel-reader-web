'use client'

import { useMemo, useState, useTransition } from 'react'
import Avatar from '@/components/Avatar'
import RelativeTime from '@/components/RelativeTime'
import { deleteComment, editComment, hideComment, postReply } from '@/lib/comment-actions'
import { MAX_COMMENT_LENGTH, commentLength } from '@/lib/comment-rules'
import type { CommentItem, CommentThread } from '@/lib/comments'
import type { UserRole } from '@/lib/current-user'
import CommentForm from '@/components/comments/CommentForm'

export type Viewer = { id: string; role: UserRole } | null

const actionButton = 'text-xs opacity-60 transition hover:opacity-100 disabled:opacity-30'

function CommentRow({
    comment,
    viewer,
    onReply,
    replyCount = 0,
    compact = false,
}: {
    comment: CommentItem
    viewer: Viewer
    onReply?: () => void // ไม่มี = ไม่แสดงปุ่มตอบกลับ (ยังไม่ล็อกอิน)
    replyCount?: number
    compact?: boolean    // การตอบกลับ: avatar เล็กลง
}) {
    const [editing, setEditing] = useState(false)
    const [draft, setDraft] = useState(comment.body)
    const [error, setError] = useState<string | null>(null)
    const [pending, startTransition] = useTransition()

    const name = comment.author?.display_name ?? 'ผู้ใช้ที่ถูกลบ'
    const edited = comment.updated_at !== comment.created_at
    const isOwner = viewer?.id === comment.user_id
    const isAdmin = viewer?.role === 'admin'

    // ทุก action: ถ้าสำเร็จ updateTag ใน server จะทำให้หน้า render ใหม่เอง
    function run(action: () => Promise<{ error?: string }>, onSuccess?: () => void) {
        setError(null)
        startTransition(async () => {
            const result = await action()
            if (result.error) setError(result.error)
            else onSuccess?.()
        })
    }

    function handleDelete() {
        const base = isOwner ? 'ลบความคิดเห็นนี้?' : `ลบความคิดเห็นของ ${name}?`
        const message = replyCount > 0 ? `${base}\nการตอบกลับ ${replyCount} รายการจะถูกลบไปด้วย` : base
        if (!window.confirm(message)) return
        run(() => deleteComment(comment.id))
    }

    function handleHide() {
        if (!window.confirm(`ซ่อนความคิดเห็นของ ${name}? (ทุกคนรวมถึงเจ้าของจะไม่เห็นอีก)`)) return
        run(() => hideComment(comment.id))
    }

    function handleSave() {
        run(() => editComment(comment.id, draft), () => setEditing(false))
    }

    const draftLength = commentLength(draft.trim())
    const draftInvalid = draftLength === 0 || draftLength > MAX_COMMENT_LENGTH

    return (
        // div ไม่ใช่ li: คนเรียกเป็นคนห่อ <li> เอง (คอมเมนต์หลักอยู่ใน <li> ของ thread)
        <div className={`flex gap-3 ${pending ? 'opacity-60' : ''}`}>
            <Avatar name={name} url={comment.author?.avatar_url ?? null} size={compact ? 'sm' : 'md'} />
            <div className="min-w-0 flex-1">
                <p className="text-sm">
                    <span className="font-semibold">{name}</span>
                    <span className="opacity-50">
                        {' · '}
                        <RelativeTime iso={comment.created_at} />
                        {edited && ' · แก้ไขแล้ว'}
                    </span>
                </p>

                {editing ? (
                    <div className="mt-2 space-y-2">
                        <textarea
                            value={draft}
                            onChange={(e) => setDraft(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Escape') {
                                    setEditing(false)
                                    setDraft(comment.body)
                                }
                                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && !draftInvalid) {
                                    e.preventDefault()
                                    handleSave()
                                }
                            }}
                            rows={3}
                            disabled={pending}
                            autoFocus
                            aria-label="แก้ไขความคิดเห็น"
                            className="w-full resize-y rounded-lg border border-current/20 bg-white/5 px-3 py-2 text-sm leading-relaxed outline-none focus:border-current/60"
                        />
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={handleSave}
                                disabled={pending || draftInvalid}
                                className="rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-black hover:bg-gray-300 disabled:opacity-40"
                            >
                                บันทึก
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setEditing(false)
                                    setDraft(comment.body)
                                    setError(null)
                                }}
                                disabled={pending}
                                className={actionButton}
                            >
                                ยกเลิก
                            </button>
                            <span className={`ml-auto text-xs tabular-nums ${draftLength > MAX_COMMENT_LENGTH ? 'text-red-400' : 'opacity-50'}`}>
                                {draftLength}/{MAX_COMMENT_LENGTH}
                            </span>
                        </div>
                    </div>
                ) : (
                    // ข้อความธรรมดา: React escape ให้ ห้ามใช้ dangerouslySetInnerHTML
                    <p className="mt-1 whitespace-pre-wrap break-words leading-relaxed">{comment.body}</p>
                )}

                {!editing && (onReply || isOwner || isAdmin) && (
                    <div className="mt-1.5 flex gap-4">
                        {onReply && (
                            <button type="button" onClick={onReply} disabled={pending} className={actionButton}>
                                ตอบกลับ
                            </button>
                        )}
                        {isOwner && (
                            <button type="button" onClick={() => setEditing(true)} disabled={pending} className={actionButton}>
                                แก้ไข
                            </button>
                        )}
                        {(isOwner || isAdmin) && (
                            <button type="button" onClick={handleDelete} disabled={pending} className={`${actionButton} hover:text-red-400`}>
                                ลบ
                            </button>
                        )}
                        {isAdmin && !isOwner && (
                            <button type="button" onClick={handleHide} disabled={pending} className={`${actionButton} hover:text-amber-400`}>
                                ซ่อน
                            </button>
                        )}
                    </div>
                )}

                {error && <p role="alert" className="mt-1 text-xs text-red-400">{error}</p>}
            </div>
        </div>
    )
}

function CommentThreadItem({ thread, viewer }: { thread: CommentThread; viewer: Viewer }) {
    // null = ปิดกล่องตอบกลับ / string = เปิดอยู่ พร้อมข้อความเริ่มต้น
    const [replyDraft, setReplyDraft] = useState<string | null>(null)
    const replyAction = useMemo(() => postReply.bind(null, thread.id), [thread.id])

    // ล็อกอินแล้วเท่านั้นถึงตอบกลับได้
    const replyTo = (mention?: string) =>
        viewer ? () => setReplyDraft(mention ? `@${mention} ` : '') : undefined

    return (
        <li>
            <CommentRow comment={thread} viewer={viewer} onReply={replyTo()} replyCount={thread.replies.length} />

            {(thread.replies.length > 0 || replyDraft !== null) && (
                <div className="ml-[3.25rem] mt-3 space-y-4 border-l border-current/15 pl-4">
                    {thread.replies.length > 0 && (
                        <ul className="space-y-4">
                            {thread.replies.map((reply) => (
                                <li key={reply.id}>
                                    <CommentRow
                                        comment={reply}
                                        viewer={viewer}
                                        onReply={replyTo(reply.author?.display_name)}
                                        compact
                                    />
                                </li>
                            ))}
                        </ul>
                    )}

                    {replyDraft !== null && (
                        <CommentForm
                            key={replyDraft} // ตอบคนละคน = ฟอร์มใหม่ ข้อความเริ่มต้นจะได้เปลี่ยนตาม
                            action={replyAction}
                            initialBody={replyDraft}
                            placeholder={`ตอบกลับ ${thread.author?.display_name ?? ''}...`}
                            submitLabel="ตอบกลับ"
                            autoFocus
                            onSuccess={() => setReplyDraft(null)}
                            onCancel={() => setReplyDraft(null)}
                        />
                    )}
                </div>
            )}
        </li>
    )
}

export default function CommentList({ threads, viewer }: { threads: CommentThread[]; viewer: Viewer }) {
    if (threads.length === 0) {
        return (
            <p className="rounded-lg border border-dashed border-current/20 py-8 text-center text-sm opacity-60">
                ยังไม่มีความคิดเห็น
            </p>
        )
    }

    return (
        <ul className="space-y-6">
            {threads.map((thread) => (
                <CommentThreadItem key={thread.id} thread={thread} viewer={viewer} />
            ))}
        </ul>
    )
}