'use client'

import { useRef, useState, useTransition, type FormEvent } from 'react'
import { setReadingProgress } from '@/app/library/actions'
import { replaceReadChapters } from '@/lib/read-chapters'

// ปรับ "อ่านถึงตอนที่ N" ได้ 2 แบบ: ปุ่ม − / + หรือพิมพ์เลขตอนแล้วกด Enter
// หน้า library ใส่ key ตามค่าปัจจุบันไว้ พอบันทึกแล้วหน้า refresh คอมโพเนนต์จะ mount ใหม่
// ช่องกรอกจึงกลับไปเป็นค่าล่าสุดเอง ไม่ต้อง sync state ใน effect
export default function ProgressStepper({
    novelId,
    currentNumber,
    prevNumber,
    nextNumber,
}: {
    novelId: string
    currentNumber: number | null // ตอนที่ไกลที่สุด (null = ยังไม่ได้อ่าน)
    prevNumber: number | null
    nextNumber: number | null
}) {
    const [pending, startTransition] = useTransition()
    const [error, setError] = useState<string | null>(null)
    const [draft, setDraft] = useState(currentNumber === null ? '' : String(currentNumber))
    // กันส่งซ้ำ: กด Enter แล้ว blur ตามมา จะยิงค่าเดิมสองรอบ
    const submittingRef = useRef(false)

    function setTo(target: number | null) {
        if (submittingRef.current || target === currentNumber) return
        submittingRef.current = true
        setError(null)

        startTransition(async () => {
            const result = await setReadingProgress(novelId, target)
            submittingRef.current = false
            if ('error' in result) {
                setError(result.error)
                return
            }
            replaceReadChapters(novelId, result.chapterIds) // ให้เครื่องนี้ตรงกับ DB ทันที
        })
    }

    // ช่องว่างหรือ 0 = ล้างความคืบหน้า, เลขอื่น = อ่านถึงตอนนั้น (ทศนิยมได้ เช่น 12.5)
    function commitDraft() {
        const text = draft.trim()
        if (text === '' || text === '0') {
            setTo(null)
            return
        }

        const value = Number(text)
        if (!Number.isFinite(value) || value < 0) {
            setError('ใส่เลขตอนเป็นตัวเลขที่ไม่ติดลบ')
            setDraft(currentNumber === null ? '' : String(currentNumber))
            return
        }
        setTo(value)
    }

    function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault()
        commitDraft()
    }

    const buttonClass =
        'grid size-8 shrink-0 place-items-center rounded-md border border-gray-700 text-base leading-none text-white transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-30 sm:size-7 sm:text-sm'

    return (
        <div>
            <form onSubmit={handleSubmit} className={`flex items-center gap-1.5 ${pending ? 'opacity-60' : ''}`}>
                <button
                    type="button"
                    onClick={() => setTo(prevNumber)} // ไม่มีตอนก่อนหน้า (prevNumber = null) = ล้างทั้งหมด
                    disabled={pending || currentNumber === null}
                    aria-label="ลดตอนที่อ่านแล้ว"
                    className={buttonClass}
                >
                    −
                </button>
                <label className="flex items-center gap-1 text-xs text-gray-400">
                    ตอน
                    <input
                        type="text"
                        inputMode="decimal" // มือถือขึ้นแป้นตัวเลข แต่ไม่มีลูกศรขึ้นลงแบบ type="number"
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        onBlur={commitDraft}
                        onFocus={(e) => e.target.select()}
                        disabled={pending}
                        placeholder="-"
                        aria-label="อ่านถึงตอนที่"
                        className="h-8 w-14 rounded-md border border-gray-700 bg-transparent px-1 text-center text-sm sm:h-7 sm:w-12 sm:text-xs text-white tabular-nums outline-none focus:border-white"
                    />
                </label>
                <button
                    type="button"
                    onClick={() => setTo(nextNumber)}
                    disabled={pending || nextNumber === null}
                    aria-label="เพิ่มตอนที่อ่านแล้ว"
                    className={buttonClass}
                >
                    +
                </button>
            </form>
            {error && <p role="alert" className="mt-1 text-xs text-red-400">{error}</p>}
        </div>
    )
}
