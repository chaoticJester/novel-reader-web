'use client'

import { useActionState, useRef, useState } from 'react'
import type { CommentFormState } from '@/lib/comment-actions'
import { MAX_COMMENT_LENGTH, commentLength } from '@/lib/comment-rules'

type Action = (previous: CommentFormState, formData: FormData) => Promise<CommentFormState>

export default function CommentForm({
    action,
    initialBody = '',
    placeholder = 'แสดงความคิดเห็น...',
    submitLabel = 'ส่ง',
    autoFocus = false,
    onSuccess,
    onCancel,
}: {
    action: Action
    initialBody?: string   // เช่น "@ชื่อ " ตอนตอบ "การตอบกลับ"
    placeholder?: string
    submitLabel?: string
    autoFocus?: boolean
    onSuccess?: () => void // ฟอร์มตอบกลับ: ปิดกล่องเมื่อส่งสำเร็จ
    onCancel?: () => void  // มีค่า = แสดงปุ่มยกเลิก
}) {
    const [length, setLength] = useState(commentLength(initialBody))

    const [state, formAction, pending] = useActionState(async (previous: CommentFormState, formData: FormData) => {
        const result = await action(previous, formData)
        if (result.success) {
            setLength(0)
            onSuccess?.()
        }
        return result
    }, {})

    const tooLong = length > MAX_COMMENT_LENGTH
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    // ครอบข้อความที่เลือกด้วย ||...|| (ไม่ได้เลือกอะไร = ใส่ตัวอย่างแล้วเลือกคำนั้นไว้ให้พิมพ์ทับ)
    // textarea เป็น uncontrolled จึงแก้ value ตรงได้ แต่ไม่เกิด onChange ต้องอัปเดตตัวนับเอง
    function wrapSpoiler() {
        const textarea = textareaRef.current
        if (!textarea) return

        const { selectionStart: start, selectionEnd: end, value } = textarea
        const selected = value.slice(start, end) || 'สปอยล์'
        textarea.value = `${value.slice(0, start)}||${selected}||${value.slice(end)}`

        textarea.focus()
        textarea.setSelectionRange(start + 2, start + 2 + selected.length)
        setLength(commentLength(textarea.value))
    }

    return (
        <form action={formAction} className="flex-1 space-y-2">
            <textarea
                ref={textareaRef}
                name="body"
                rows={3}
                required
                maxLength={MAX_COMMENT_LENGTH * 2} // ให้ server เป็นคนตัดสิน (อีโมจิกินที่ 2 หน่วยใน JS)
                defaultValue={state.body ?? initialBody}
                autoFocus={autoFocus}
                placeholder={placeholder}
                onChange={(e) => setLength(commentLength(e.target.value))}
                onKeyDown={(e) => {
                    // Ctrl+Enter (Mac: Cmd+Enter) = ส่ง
                    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                        e.preventDefault()
                        e.currentTarget.form?.requestSubmit()
                    } 
                    if (e.key === 'Escape' && onCancel) onCancel()
                }}
                disabled={pending}
                aria-label="ความคิดเห็น"
                className="w-full resize-y rounded-lg border border-current/20 bg-white/5 px-3 py-2 text-sm leading-relaxed outline-none transition placeholder:opacity-50 focus:border-current/60 disabled:opacity-60"
            />

            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={wrapSpoiler}
                        disabled={pending}
                        title="ครอบข้อความที่เลือกเป็นสปอยล์ (||ข้อความ||)"
                        className="rounded-md border border-current/20 px-2 py-1 text-xs opacity-70 transition hover:opacity-100"
                    >
                        ⬛ สปอยล์
                    </button>
                    <span className={`text-xs tabular-nums ${tooLong ? 'text-red-400' : 'opacity-50'}`}>
                        {length}/{MAX_COMMENT_LENGTH}
                    </span>
                </div>
                <div className="flex items-center gap-3">
                    {onCancel && (
                        <button type="button" onClick={onCancel} disabled={pending} className="text-sm opacity-60 hover:opacity-100">
                            ยกเลิก
                        </button>
                    )}
                    <button
                        type="submit"
                        disabled={pending || length === 0 || tooLong}
                        className="rounded-lg bg-white px-4 py-2 text-sm font-bold text-black transition hover:bg-gray-300 disabled:opacity-40"
                    >
                        {pending ? 'กำลังส่ง...' : submitLabel}
                    </button>
                </div>
            </div>

            {state.error && <p role="alert" className="text-sm text-red-400">{state.error}</p>}
        </form>
    )
}