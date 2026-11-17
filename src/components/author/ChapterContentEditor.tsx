'use client'

import { useRef, useState } from 'react'
import type { ChapterImageUploadResult } from '@/app/author/actions'

type Props = {
    defaultValue: string
    className: string
    uploadImageAction: (formData: FormData) => Promise<ChapterImageUploadResult>
}

export default function ChapterContentEditor({ defaultValue, className, uploadImageAction }: Props) {
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [uploading, setUploading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    function insertAtCursor(snippet: string) {
        const textarea = textareaRef.current
        if (!textarea) return

        const { selectionStart, selectionEnd, value } = textarea
        const before = value.slice(0, selectionStart)
        const after = value.slice(selectionEnd)

        // Put the image on its own paragraph so Markdown renders it as a block.
        const prefix = before.length === 0 || before.endsWith('\n\n') ? '' : before.endsWith('\n') ? '\n' : '\n\n'
        const suffix = after.startsWith('\n\n') ? '' : after.startsWith('\n') ? '\n' : '\n\n'
        const inserted = `${prefix}${snippet}${suffix}`

        textarea.focus()
        textarea.setSelectionRange(selectionStart, selectionEnd)
        // execCommand keeps the browser's undo history; fall back to setRangeText.
        if (!document.execCommand('insertText', false, inserted)) {
            textarea.setRangeText(inserted, selectionStart, selectionEnd, 'end')
        }
    }

    async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0]
        event.target.value = ''
        if (!file) return

        setError(null)
        setUploading(true)

        try {
            const formData = new FormData()
            formData.append('image', file)
            const result = await uploadImageAction(formData)

            if (result.ok) {
                insertAtCursor(`![ภาพประกอบ](${result.url})`)
            } else {
                setError(result.error)
            }
        } catch {
            setError('อัปโหลดรูปประกอบไม่สำเร็จ กรุณาลองใหม่')
        } finally {
            setUploading(false)
        }
    }

    return (
        <div>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
                <label htmlFor="content" className="block text-sm font-bold text-slate-700 dark:text-slate-200">เนื้อหา</label>
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-bold text-slate-700 transition hover:border-indigo-400 hover:text-indigo-600 disabled:cursor-wait disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:text-indigo-300"
                >
                    {uploading ? 'กำลังอัปโหลด...' : '🖼 แทรกรูป'}
                </button>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={handleFileChange}
                    className="hidden"
                />
            </div>
            {error && <p role="alert" className="mb-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
            <textarea
                ref={textareaRef}
                id="content"
                name="content"
                rows={30}
                required
                defaultValue={defaultValue}
                placeholder="เริ่มเขียนเนื้อหาตอนนี้..."
                className={className}
            />
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">รูปจะถูกแทรกที่ตำแหน่งเคอร์เซอร์ · JPG, PNG, WebP หรือ GIF ไม่เกิน 5 MB</p>
        </div>
    )
}
