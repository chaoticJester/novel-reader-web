'use client'

import { useActionState, useState } from 'react'
import type { CommentFormState } from '@/lib/comment-actions'
import { MAX_COMMENT_LENGTH, commentLength } from '@/lib/comment-rules'

type Action = (previous: CommentFormState, formData: FormData) => Promise<CommentFormState>

export default function CommentForm({ action }: { action: Action }) {
    const [length, setLength] = useState(0)

    // ห่อ action: สำเร็จแล้วรีเซ็ตตัวนับ (ช่องข้อความ React รีเซ็ตให้เองหลัง action จบ)
    const [state, formAction, pending] = useActionState(async (previous: CommentFormState, formData: FormData) => {
        const result = await action(previous, formData)
        if (result.success) setLength(0)
        return result
    }, {})

    const tooLong = length > MAX_COMMENT_LENGTH

    return (
        <form action={formAction} className="flex-1 space-y-2">
            <textarea
                name="body"
                rows={3}
                required
                maxLength={MAX_COMMENT_LENGTH * 2} // ให้ server เป็นคนตัดสิน (อีโมจิกินที่ 2 หน่วยใน JS)
                defaultValue={state.body} // error: ข้อความที่พิมพ์ไว้กลับมาหลังฟอร์มรีเซ็ต
                onChange={(e) => setLength(commentLength(e.target.value))}
                onKeyDown={(e) => {
                    // Ctrl+Enter (Mac: Cmd+Enter) = ส่ง
                    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                        e.preventDefault()
                        e.currentTarget.form?.requestSubmit()
                    }
                }}
                disabled={pending}
                placeholder="แสดงความคิดเห็น..."
                aria-label="ความคิดเห็น"
                className="w-full resize-y rounded-lg border border-current/20 bg-white/5 px-3 py-2 text-sm leading-relaxed outline-none transition placeholder:opacity-50 focus:border-current/60 disabled:opacity-60"
            />

            <div className="flex items-center justify-between gap-3">
                <span className={`text-xs tabular-nums ${tooLong ? 'text-red-400' : 'opacity-50'}`}>
                    {length}/{MAX_COMMENT_LENGTH}
                </span>
                <button
                    type="submit"
                    disabled={pending || length === 0 || tooLong}
                    className="rounded-lg bg-white px-4 py-2 text-sm font-bold text-black transition hover:bg-gray-300 disabled:opacity-40"
                >
                    {pending ? 'กำลังส่ง...' : 'ส่ง'}
                </button>
            </div>

            {state.error && <p role="alert" className="text-sm text-red-400">{state.error}</p>}
        </form>
    )
}