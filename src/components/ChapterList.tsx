'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import RelativeTime from '@/components/RelativeTime'
import { getReadChapters, READ_CHAPTERS_EVENT } from '@/lib/read-chapters'

interface Chapter {
    id: string
    title: string
    chapter_number: number
    created_at: string
}

export default function ChapterList({ novelId, chapters }: { novelId: string; chapters: Chapter[] }) {
    // ค่าเริ่มต้น: เรียงจากมากไปน้อย (ตอนใหม่สุดอยู่บน)
    const [search, setSearch] = useState('')
    const [order, setOrder] = useState<'desc' | 'asc'>('desc')
    const [readChapters, setReadChapters] = useState<string[]>([])

    useEffect(() => {
        const update = () => setReadChapters(getReadChapters(novelId))
        update()
        window.addEventListener('storage', update)
        window.addEventListener(READ_CHAPTERS_EVENT, update)
        return () => {
            window.removeEventListener('storage', update)
            window.removeEventListener(READ_CHAPTERS_EVENT, update)
        }
    }, [novelId])

    const filteredAndSorted = useMemo(() => {
        const keyword = search.trim().toLowerCase()

        return [...chapters]
            .filter((chapter) => {
                if (!keyword) return true

                return (
                    chapter.title.toLowerCase().includes(keyword) ||
                    chapter.chapter_number.toString().includes(keyword)
                )
            })
            .sort((a, b) =>
                order === 'asc'
                    ? a.chapter_number - b.chapter_number
                    : b.chapter_number - a.chapter_number
            )
    }, [chapters, order, search])

    return (
        <div>
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-2xl font-bold">
                    รายชื่อตอน
                </h2>

                <div className="flex items-center gap-2">
                    <div className="relative flex-1 sm:w-128 sm:flex-none">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                        >
                            <circle cx="11" cy="11" r="8" />
                            <path d="m21 21-4.3-4.3" />
                        </svg>

                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="ค้นหาตอน..."
                            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-10 pr-3 text-sm outline-none transition focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                        />
                    </div>

                    <button
                        onClick={() =>
                            setOrder((o) => (o === 'desc' ? 'asc' : 'desc'))
                        }
                        aria-label="สลับการเรียงลำดับตอน"
                        className="flex shrink-0 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 transition-colors hover:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-blue-500"
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
                            className={
                                order === 'asc'
                                    ? 'rotate-180 transition-transform'
                                    : 'transition-transform'
                            }
                        >
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <polyline points="19 12 12 19 5 12" />
                        </svg>
                    </button>
                </div>
            </div>

            <ul className="space-y-2">
                {filteredAndSorted.map((chapter) => (
                    <li key={chapter.id}>
                        <Link
                            href={`/novel/${novelId}/chapter/${chapter.id}`}
                            className="flex items-baseline gap-4 p-4 bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-sm transition-all"
                        >
                            <div className='vertical-align: middle'>
                                <p className={`font-semibold whitespace-nowrap ${readChapters.includes(chapter.id) ? 'text-black dark:text-slate-600' : 'text-black dark:text-slate-100'}`}>
                                    ตอนที่ {chapter.chapter_number}
                                </p>
                                <p className={`line-clamp-1 ${readChapters.includes(chapter.id) ? 'text-black dark:text-slate-600' : 'text-black dark:text-slate-400'}`}>{chapter.title}</p>
                                <p className="text-sm text-gray-400 dark:text-slate-500 whitespace-nowrap ml-auto">
                                    <RelativeTime iso={chapter.created_at} />
                                </p>
                            </div>
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    )
}
