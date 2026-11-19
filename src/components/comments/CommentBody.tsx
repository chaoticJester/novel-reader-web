'use client'

import { useState } from 'react'

// ||ข้อความ|| = สปอยล์ ([\s\S] = ข้ามบรรทัดได้, +? = จับสั้นที่สุด, ต้องมีอย่างน้อย 1 ตัว)
const SPOILER_PATTERN = /\|\|([\s\S]+?)\|\|/g

function Spoiler({ text }: { text: string }) {
    const [revealed, setRevealed] = useState(false)

    if (revealed) {
        return <span className="rounded bg-gray-500/20 px-0.5">{text}</span>
    }

    return (
        <span
            role="button"
            tabIndex={0}
            onClick={() => setRevealed(true)}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    setRevealed(true)
                }
            }}
            aria-label="สปอยล์ แตะเพื่อดู"
            title="สปอยล์ แตะเพื่อดู"
            className="cursor-pointer select-none rounded bg-gray-600 px-0.5 text-transparent transition hover:bg-gray-500"
        >
            {/* aria-hidden: โปรแกรมอ่านหน้าจอจะได้ไม่อ่านสปอยล์ออกมาก่อนผู้ใช้เลือกดู */}
            <span aria-hidden="true">{text}</span>
        </span>
    )
}

export default function CommentBody({ text }: { text: string }) {
    // split พร้อมวงเล็บจับกลุ่ม → index คี่คือข้อความในสปอยล์ index คู่คือข้อความธรรมดา
    const parts = text.split(SPOILER_PATTERN)

    return (
        // ข้อความธรรมดาทั้งหมด: React escape ให้ ห้ามใช้ dangerouslySetInnerHTML
        <p className="mt-1 whitespace-pre-wrap break-words leading-relaxed">
            {parts.map((part, index) =>
                index % 2 === 1 ? <Spoiler key={index} text={part} /> : part,
            )}
        </p>
    )
}