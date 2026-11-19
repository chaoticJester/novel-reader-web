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

// จำนวนตอนที่แสดงบนจอมือถือ (ต่ำกว่า sm) เพื่อให้การ์ดไม่ยาวเกินไป
const MOBILE_LIMIT = 3

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
        // มือถือ: เต็มความกว้าง เวลาชิดขวา แสดง 3 ตอน · คอม: กริดพอดีเนื้อหา แสดงครบ 5 ตอน
        <ul className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-4 gap-y-1.5 text-sm sm:inline-grid sm:w-auto sm:max-w-full sm:grid-cols-[auto_auto] sm:gap-x-6 sm:gap-y-1">
            {chapters.map((chapter, index) => {
                const isRead = readChapters.includes(chapter.id)
                return (
                    <li key={chapter.id} className={`contents group ${index >= MOBILE_LIMIT ? 'max-sm:hidden' : ''}`}>
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
