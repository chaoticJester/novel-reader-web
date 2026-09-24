'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import RelativeTime from '@/components/RelativeTime'
import { getReadChapters, READ_CHAPTERS_EVENT } from '@/lib/read-chapters'

interface Chapter {
    id: string
    chapter_number: number
    created_at: string
}

export default function RecentChapters({ novelId, chapters }: { novelId: string; chapters: Chapter[] }) {
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

    return (
        <ul className="inline-grid grid-cols-[auto_auto] items-baseline gap-x-6 gap-y-1 max-w-full text-sm">
            {chapters.map((chapter) => {
                const isRead = readChapters.includes(chapter.id)
                return (
                    <li key={chapter.id} className="contents group">
                        <Link href={`/novel/${novelId}/chapter/${chapter.id}`} className="contents">
                            <span className={`whitespace-nowrap transition-colors group-hover:text-blue-600 dark:group-hover:text-blue-400 ${isRead ? 'text-gray-700 dark:text-slate-700' : 'text-gray-400 dark:text-slate-500'}`}>
                                ตอนที่ {chapter.chapter_number}
                            </span>
                            <span className="text-gray-400 dark:text-slate-500 whitespace-nowrap text-xs text-right">
                                <RelativeTime iso={chapter.created_at} />
                            </span>
                        </Link>
                    </li>
                )
            })}
        </ul>
    )
}
