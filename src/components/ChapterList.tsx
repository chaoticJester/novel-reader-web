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

                return chapter.title.toLowerCase().includes(keyword) || chapter.chapter_number === Number(keyword) 
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
                <h2 className="text-xl font-bold sm:text-2xl">
                    รายชื่อตอน <span className="text-base font-normal text-slate-500 dark:text-slate-400">({chapters.length})</span>
                </h2>

                <div className="flex items-center gap-2">
                    <div className="relative flex-1 sm:w-80 sm:flex-none lg:w-96">
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

                        {/* มือถือใช้ text-base (16px) กัน iOS ซูมหน้าตอนแตะช่องพิมพ์ */}
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="ค้นหาตอน..."
                            className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-base outline-none transition focus:border-blue-500 sm:text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                        />
                    </div>

                    <button
                        onClick={() =>
                            setOrder((o) => (o === 'desc' ? 'asc' : 'desc'))
                        }
                        aria-label={order === 'desc' ? 'เรียงใหม่ไปเก่า (กดเพื่อสลับ)' : 'เรียงเก่าไปใหม่ (กดเพื่อสลับ)'}
                        className="flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 transition-colors hover:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-blue-500"
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

            {/* กล่องเลื่อนในตัวทุกขนาดจอ: เรื่องที่มีหลายร้อยตอนจะไม่ดันคอมเมนต์ลงไปไกล
                มือถือ: สูง 70% ของจอ (dvh = ไม่นับแถบที่อยู่ของเบราว์เซอร์ที่ยุบ/ขยายได้) · คอม: ขนาดเดิม */}
            <div className="chapter-list-scrollbar max-h-[70dvh] overflow-y-auto pr-1 md:max-h-156">
              <ul className="space-y-2">
                  {filteredAndSorted.map((chapter) => {
                      const isRead = readChapters.includes(chapter.id)
                      return (
                          <li key={chapter.id}>
                              {/* มือถือ: 2 บรรทัด (เลขตอน + เวลา / ชื่อตอน) · คอม: บรรทัดเดียว เลขตอน | ชื่อตอน | เวลา */}
                              <Link
                                  href={`/novel/${novelId}/chapter/${chapter.id}`}
                                  className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-3 gap-y-0.5 rounded-lg border border-slate-200 bg-white px-4 py-3 transition-all hover:border-blue-500 hover:shadow-sm md:grid-cols-[7rem_minmax(0,1fr)_auto] md:gap-x-4 md:p-4 dark:border-slate-700 dark:bg-slate-800/60 dark:hover:border-blue-500"
                              >
                                  <p className={`whitespace-nowrap font-semibold ${isRead ? 'text-black dark:text-slate-600' : 'text-black dark:text-slate-100'}`}>
                                      ตอนที่ {chapter.chapter_number}
                                  </p>
                                  <p className={`col-span-2 row-start-2 line-clamp-1 text-sm md:col-span-1 md:row-start-auto md:text-base ${isRead ? 'text-black dark:text-slate-600' : 'text-black dark:text-slate-400'}`}>
                                      {chapter.title}
                                  </p>
                                  <p className="col-start-2 row-start-1 whitespace-nowrap text-right text-xs text-gray-400 md:col-start-auto md:row-start-auto md:text-sm dark:text-slate-500">
                                      <RelativeTime iso={chapter.created_at} />
                                  </p>
                              </Link>
                          </li>
                      )
                  })}
              </ul>
              {filteredAndSorted.length === 0 && (
                  <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">ไม่พบตอนที่ค้นหา</p>
              )}
            </div>
        </div>
    )
}
