'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import RelativeTime from '@/components/RelativeTime'

interface Chapter {
    id: string
    title: string
    chapter_number: number
    created_at: string
}

export default function ChapterList({ novelId, chapters }: { novelId: string; chapters: Chapter[] }) {
    // ค่าเริ่มต้น: เรียงจากมากไปน้อย (ตอนใหม่สุดอยู่บน)
    const [order, setOrder] = useState<'desc' | 'asc'>('desc')

    const sorted = useMemo(
        () =>
            [...chapters].sort((a, b) =>
                order === 'asc' ? a.chapter_number - b.chapter_number : b.chapter_number - a.chapter_number,
            ),
        [chapters, order],
    )

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">รายชื่อตอน</h2>
                <button
                    onClick={() => setOrder((o) => (o === 'desc' ? 'asc' : 'desc'))}
                    aria-label="สลับการเรียงลำดับตอน"
                    className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-blue-500 dark:hover:border-blue-500 transition-colors"
                >
                    {order === 'desc' ? 'ใหม่ → เก่า' : 'เก่า → ใหม่'}
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className={order === 'asc' ? 'rotate-180 transition-transform' : 'transition-transform'}
                    >
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <polyline points="19 12 12 19 5 12"></polyline>
                    </svg>
                </button>
            </div>

            <ul className="space-y-2">
                {sorted.map((chapter) => (
                    <li key={chapter.id}>
                        <Link
                            href={`/novel/${novelId}/chapter/${chapter.id}`}
                            className="flex items-baseline gap-4 p-4 bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-sm transition-all"
                        >
                            <span className="font-semibold text-black dark:text-slate-100 whitespace-nowrap">
                                ตอนที่ {chapter.chapter_number}
                            </span>
                            <span className="text-black dark:text-slate-300 line-clamp-1">{chapter.title}</span>
                            <span className="text-sm text-gray-400 dark:text-slate-500 whitespace-nowrap ml-auto">
                                <RelativeTime iso={chapter.created_at} />
                            </span>
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    )
}
