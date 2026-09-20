'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import DeleteButton from '@/components/author/DeleteButton'
import StatusBadge from '@/components/author/StatusBadge'
import { deleteChapter } from '@/app/author/actions'

type Chapter = {
    id: string
    title: string
    chapter_number: number
    publication_status: 'draft' | 'published'
}

export default function ChapterList({
    chapters,
    novelId,
}: {
    chapters: Chapter[]
    novelId: string
}) {
    const [search, setSearch] = useState('')
    const [order, setOrder] = useState<'desc' | 'asc'>('desc')

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
        <div className="w-full">
            {/* Header */}
            <div className="mb-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-xs font-bold tracking-[0.18em] text-indigo-600 dark:text-indigo-400">
                            CHAPTERS
                        </p>

                        <h2 className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
                            รายชื่อตอน
                        </h2>

                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            {chapters.length} ตอนในนิยายเรื่องนี้
                        </p>
                    </div>

                    <Link
                        href={`/author/novels/${novelId}/chapters/new`}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 transition hover:-translate-y-0.5 hover:bg-indigo-500 sm:w-auto"
                    >
                        <span className="text-lg leading-none">＋</span>
                        เพิ่มตอน
                    </Link>
                </div>

                {/* Toolbar */}
                <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-3 sm:flex-row sm:items-center dark:border-white/10 dark:bg-white/[0.03]">
                    <div className="relative min-w-0 flex-1">
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
                            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                        >
                            <circle cx="11" cy="11" r="8" />
                            <path d="m21 21-4.3-4.3" />
                        </svg>

                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="ค้นหาด้วยเลขตอนหรือชื่อตอน..."
                            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100"
                        />
                    </div>

                    <button
                        type="button"
                        onClick={() =>
                            setOrder((o) => (o === 'desc' ? 'asc' : 'desc'))
                        }
                        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:border-indigo-300 hover:text-indigo-600 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-indigo-400/40 dark:hover:text-indigo-300"
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
                            className={`transition-transform ${order === 'asc' ? 'rotate-180' : ''
                                }`}
                        >
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <polyline points="19 12 12 19 5 12" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Chapter list */}
            <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-white/10 dark:bg-slate-900/80">
                {filteredAndSorted.map((chapter) => (
                    <div
                        key={chapter.id}
                        className="group flex flex-col gap-3 border-b border-slate-200/80 px-5 py-4 transition hover:bg-slate-50/70 last:border-0 sm:flex-row sm:items-center sm:justify-between dark:border-white/10 dark:hover:bg-white/[0.03]"
                    >
                        <div className="flex min-w-0 items-center gap-4">
                            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-slate-100 text-sm font-black text-slate-600 transition group-hover:bg-indigo-50 group-hover:text-indigo-600 dark:bg-white/5 dark:text-slate-300 dark:group-hover:bg-indigo-400/10 dark:group-hover:text-indigo-300">
                                {chapter.chapter_number}
                            </span>

                            <div className="min-w-0">
                                <p className="truncate font-bold text-slate-900 dark:text-slate-100">
                                    {chapter.title}
                                </p>

                                <div className="mt-1">
                                    <StatusBadge status={chapter.publication_status} />
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-1 self-end sm:self-auto">
                            <Link
                                href={`/author/novels/${novelId}/chapters/${chapter.id}/edit`}
                                className="rounded-lg px-3 py-2 text-sm font-bold text-indigo-600 transition hover:bg-indigo-50 dark:text-indigo-300 dark:hover:bg-indigo-400/10"
                            >
                                แก้ไข
                            </Link>

                            <DeleteButton
                                compact
                                action={deleteChapter.bind(
                                    null,
                                    novelId,
                                    chapter.id
                                )}
                                message={`ลบตอนที่ ${chapter.chapter_number} “${chapter.title}” อย่างถาวรหรือไม่?`}
                            />
                        </div>
                    </div>
                ))}

                {chapters.length === 0 && (
                    <div className="px-6 py-14 text-center">
                        <p className="font-bold text-slate-700 dark:text-slate-200">
                            ยังไม่มีตอน
                        </p>

                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            เริ่มเขียนตอนแรกของนิยายเรื่องนี้ได้เลย
                        </p>

                        <Link
                            href={`/author/novels/${novelId}/chapters/new`}
                            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 transition hover:-translate-y-0.5 hover:bg-indigo-500"
                        >
                            <span className="text-lg leading-none">＋</span>
                            เพิ่มตอนแรก
                        </Link>
                    </div>
                )}

                {chapters.length > 0 && filteredAndSorted.length === 0 && (
                    <div className="px-6 py-14 text-center">
                        <div className="mx-auto grid size-12 place-items-center rounded-full bg-slate-100 text-slate-400 dark:bg-white/5">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <circle cx="11" cy="11" r="8" />
                                <path d="m21 21-4.3-4.3" />
                            </svg>
                        </div>

                        <p className="mt-4 font-bold text-slate-700 dark:text-slate-200">
                            ไม่พบตอนที่ค้นหา
                        </p>

                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            ลองค้นหาด้วยเลขตอนหรือคำอื่น
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}