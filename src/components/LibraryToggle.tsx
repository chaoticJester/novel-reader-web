'use client'

import { useState, useTransition } from 'react'
import { addToLibrary, removeFromLibrary } from '@/app/library/actions'

export default function LibraryToggle({
    novelId,
    initialInLibrary,
    className = '',
    compact = false,
}: {
    novelId: string
    initialInLibrary: boolean
    className?: string
    compact?: boolean // ไอคอนอย่างเดียว สำหรับการ์ดในชั้นหนังสือ
}) {
    const [inLibrary, setInLibrary] = useState(initialInLibrary)
    const [error, setError] = useState<string | null>(null)
    const [pending, startTransition] = useTransition()

    function toggle() {
        const next = !inLibrary
        setInLibrary(next) // optimistic: เปลี่ยนทันที ไม่ต้องรอ server
        setError(null)

        startTransition(async () => {
            const result = next ? await addToLibrary(novelId) : await removeFromLibrary(novelId)
            if (result.error) {
                setInLibrary(!next) // ไม่สำเร็จ: ย้อนกลับ
                setError(result.error)
            }
        })
    }

    const label = inLibrary ? 'นำออกจากชั้นหนังสือ' : 'เพิ่มเข้าชั้นหนังสือ'

    if (compact) {
        return (
            <div className={className}>
                <button
                    type="button"
                    onClick={toggle}
                    disabled={pending}
                    aria-pressed={inLibrary}
                    aria-label={label} // ไม่มีข้อความบนปุ่ม: โปรแกรมอ่านหน้าจอใช้ข้อความนี้แทน
                    title={label}
                    className="grid size-8 place-items-center rounded-md text-sm text-gray-500 sm:size-7 transition hover:bg-gray-800 hover:text-red-300 disabled:opacity-60"
                >
                    {inLibrary ? '✕' : '+'}
                </button>
                {error && <p role="alert" className="mt-1 text-xs text-red-400">{error}</p>}
            </div>
        )
    }

    return (
        <div className={className}>
            <button
                type="button"
                onClick={toggle}
                disabled={pending}
                aria-pressed={inLibrary}
                className={`inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg px-5 text-sm font-semibold transition-colors disabled:opacity-60 ${
                    inLibrary
                        ? 'border border-slate-600 text-slate-200 hover:border-red-400 hover:text-red-300'
                        : 'border border-slate-600 text-slate-200 hover:border-blue-500'
                }`}
            >
                {inLibrary ? '✓ อยู่ในชั้นหนังสือ' : '+ เพิ่มเข้าชั้นหนังสือ'}
            </button>
            {error && <p role="alert" className="mt-1 text-xs text-red-400">{error}</p>}
        </div>
    )
}