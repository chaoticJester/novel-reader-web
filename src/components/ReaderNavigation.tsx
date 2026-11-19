'use client'

import { useCallback, useEffect, useRef, useState, type MouseEvent, type ReactNode } from 'react'
import Link from 'next/link'
import ReaderSettings from '@/components/ReaderSettings'
import { useReaderSettings } from '@/components/ReaderSettingsProvider'
import TableOfContentsShelf from '@/components/TableOfContentsShelf'
import { addPendingRead, getReadChapters, setChapterRead } from '@/lib/read-chapters'
import { markChapterRead } from '@/lib/chapter-reads-actions'


export interface ReaderChapter {
    id: string
    title: string
    chapter_number: number
    created_at: string
}

export interface ReaderChapterReference {
    id: string
}

export interface ReaderFont {
    key: string
    label: string
    className: string
}

interface ReaderNavigationProps {
    novelId: string
    chapterId: string
    chapterNumber: number
    chapterTitle: string
    novelTitle: string
    previousChapter: ReaderChapterReference | null
    nextChapter: ReaderChapterReference | null
    chapters: ReaderChapter[]
    fonts: ReaderFont[]
    children: ReactNode
    comments?: ReactNode // แสดงต่อจากส่วนอ่าน พื้นดำเสมอ และแตะแล้วไม่เปิดเมนู
}

const SCROLL_THRESHOLD = 12
const COMMENTS_VISIBLE_LIMIT = 0.05 // สัดส่วนของความสูงจอ

const isInteractiveTarget = (target: EventTarget | null) =>
    target instanceof Element && Boolean(target.closest('a, button, input, textarea, select, label, [role="button"]'))

export default function ReaderNavigation({
    novelId,
    chapterId,
    chapterNumber,
    chapterTitle,
    novelTitle,
    previousChapter,
    nextChapter,
    chapters,
    fonts,
    children,
    comments,
}: ReaderNavigationProps) {
    const { theme } = useReaderSettings()
    const [isNavigationVisible, setIsNavigationVisible] = useState(true)
    const [isSettingsOpen, setIsSettingsOpen] = useState(false)
    const [isTocOpen, setIsTocOpen] = useState(false)
    const [progress, setProgress] = useState(0)
    const completedChapterRef = useRef<string | null>(null)
    const lastScrollYRef = useRef(0)
    const animationFrameRef = useRef<number | null>(null)
    const readerRef = useRef<HTMLDivElement>(null) // ส่วนอ่าน: ใช้วัดว่าอ่านถึงท้ายตอนหรือยัง
    const commentsRef = useRef<HTMLDivElement>(null) // ส่วนคอมเมนต์: ใช้เช็กว่าโผล่บนจอเยอะแค่ไหน

    const panelIsOpen = isSettingsOpen || isTocOpen
    const controlsVisible = isNavigationVisible || panelIsOpen

    // วัดจากปลาย "ส่วนอ่าน" ไม่ใช่ปลายหน้า: คอมเมนต์ด้านล่างจะได้ไม่ถูกนับเป็นเนื้อหาตอน
    const measure = useCallback(() => {
        const reader = readerRef.current
        if (!reader) return { progress: 0, reachedEnd: false }

        const readerBottom = reader.getBoundingClientRect().bottom + window.scrollY
        const maxScroll = readerBottom - window.innerHeight
        if (maxScroll <= 0) return { progress: 1, reachedEnd: true } // ตอนสั้นกว่าจอ

        const scrollY = window.scrollY
        return {
            progress: Math.min(1, Math.max(0, scrollY / maxScroll)),
            reachedEnd: scrollY >= maxScroll - 2, // เผื่อ 2px สำหรับค่าทศนิยมของ scroll
        }
    }, [])

    const applyProgress = useCallback(() => {
        const { progress: next, reachedEnd } = measure()
        setProgress((current) => (Math.abs(current - next) > 0.001 ? next : current))
        if (reachedEnd && completedChapterRef.current !== chapterId) {
            completedChapterRef.current = chapterId
            if (!getReadChapters(novelId).includes(chapterId)) {
                setChapterRead(novelId, chapterId, true)
                markChapterRead(chapterId)
                    .then((saved) => {
                        if (!saved) addPendingRead(chapterId)
                    })
                    .catch(() => addPendingRead(chapterId))
            }
        }
    }, [measure, novelId, chapterId])

    useEffect(() => {
        lastScrollYRef.current = window.scrollY
        const frame = window.requestAnimationFrame(applyProgress)
        return () => window.cancelAnimationFrame(frame)
    }, [applyProgress])

    useEffect(() => {
        const updateFromScroll = () => {
            animationFrameRef.current = null
            const currentScrollY = window.scrollY
            const delta = currentScrollY - lastScrollYRef.current
            lastScrollYRef.current = currentScrollY
            applyProgress()

            if (panelIsOpen) {
                setIsNavigationVisible(true)
            } else if (delta > SCROLL_THRESHOLD) {
                setIsNavigationVisible(false)
            }
        }

        const onScroll = () => {
            if (animationFrameRef.current === null) {
                animationFrameRef.current = window.requestAnimationFrame(updateFromScroll)
            }
        }
        const onResize = () => window.requestAnimationFrame(applyProgress)

        window.addEventListener('scroll', onScroll, { passive: true })
        window.addEventListener('resize', onResize)
        const resizeObserver = new ResizeObserver(onResize)
        resizeObserver.observe(document.documentElement)

        return () => {
            window.removeEventListener('scroll', onScroll)
            window.removeEventListener('resize', onResize)
            resizeObserver.disconnect()
            if (animationFrameRef.current !== null) window.cancelAnimationFrame(animationFrameRef.current)
        }
    }, [applyProgress, panelIsOpen])

    const toggleNavigation = () => {
        if (panelIsOpen) {
            setIsNavigationVisible(true)
            return
        }
        setIsNavigationVisible((visible) => !visible)
    }

    // ส่วนคอมเมนต์กินพื้นที่จอเกิน 5% = ผู้ใช้กำลังจะอ่าน/เขียนคอมเมนต์ แตะเนื้อหาแล้วไม่เปิดเมนู
    const commentsTakeScreen = () => {
        const comments = commentsRef.current
        if (!comments) return false
        const rect = comments.getBoundingClientRect()
        const visibleHeight = Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0)
        return visibleHeight > window.innerHeight * COMMENTS_VISIBLE_LIMIT
    }

    const handleReaderClick = (event: MouseEvent<HTMLDivElement>) => {
        if (isInteractiveTarget(event.target)) return
        if (commentsTakeScreen()) return
        toggleNavigation()
    }

    const barVisibilityClass = controlsVisible ? 'translate-y-0 opacity-100' : 'pointer-events-none opacity-0'
    const readerThemeClass = {
        light: 'reader-light',
        sepia: 'reader-sepia',
        'eye-care': 'reader-eye-care',
        dark: 'reader-dark',
    }[theme]

    const endNavButton =
        'inline-flex h-12 items-center justify-center rounded-lg px-4 text-sm font-semibold transition-colors'

    const chapterEndNav = (
        <nav aria-label="เปลี่ยนตอน" className="mt-12 grid grid-cols-2 gap-3 border-t border-[var(--reader-border)] pt-8">
            {previousChapter ? (
                <Link
                    href={`/novel/${novelId}/chapter/${previousChapter.id}`}
                    className={`${endNavButton} border border-[var(--reader-border)] hover:bg-black/5 dark:hover:bg-white/5`}
                >
                    ← ตอนก่อนหน้า
                </Link>
            ) : (
                <span /> // เว้นช่องซ้ายไว้ ปุ่มตอนถัดไปจะได้อยู่ขวาเสมอ
            )}

            {nextChapter ? (
                <Link
                    href={`/novel/${novelId}/chapter/${nextChapter.id}`}
                    className={`${endNavButton} bg-blue-500 text-white hover:bg-blue-600`}
                >
                    ตอนถัดไป →
                </Link>
            ) : (
                <Link
                    href={`/novel/${novelId}`}
                    className={`${endNavButton} border border-[var(--reader-border)] hover:bg-black/5 dark:hover:bg-white/5`}
                >
                    ตอนล่าสุดแล้ว · สารบัญ
                </Link>
            )}
        </nav>
    )

    return (
        <div className="min-h-screen" data-novel-id={novelId} data-chapter-id={chapterId}>
            <header className={`fixed inset-x-0 top-0 z-30 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur transition-all duration-300 dark:border-slate-800 dark:bg-black/95 ${barVisibilityClass}`} style={{ transform: controlsVisible ? undefined : 'translateY(-100%)' }}>
                <div className="mx-auto flex h-16 max-w-5xl items-center gap-2 px-4 md:px-8">
                    <Link href={`/novel/${novelId}`} className="group min-w-0 flex-1 truncate transition-colors" aria-label={`กลับหน้ารายละเอียดนิยาย: ${novelTitle}`}>
                        <span className="block truncate text-sm font-semibold text-slate-800 transition-colors group-hover:text-blue-600 dark:text-slate-100 dark:group-hover:text-blue-400">
                            {novelTitle}
                        </span>
                        <span className="block truncate text-xs text-slate-500 dark:text-slate-400">
                            ตอนที่ {chapterNumber}: {chapterTitle}
                        </span>
                    </Link>

                    <nav className="flex shrink-0 items-center gap-1" aria-label="เมนูผู้อ่าน">
                        <Link href={`/novel/${novelId}`} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg px-2 text-slate-600 transition-colors hover:bg-slate-100 hover:text-blue-600 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-blue-400 md:px-3" aria-label="หน้ารายละเอียดนิยาย">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>
                            <span className="hidden md:inline">รายละเอียด</span>
                        </Link>
                        <Link href="/" className="inline-flex h-10 items-center justify-center gap-2 rounded-lg px-2 text-slate-600 transition-colors hover:bg-slate-100 hover:text-blue-600 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-blue-400 md:px-3" aria-label="หน้าหลัก">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" /><path d="M9 22v-6h6v6" /></svg>
                            <span className="hidden md:inline">หน้าหลัก</span>
                        </Link>
                        <ReaderSettings fonts={fonts} isOpen={isSettingsOpen} onOpenChange={setIsSettingsOpen} presentation="top-panel" showLabel triggerClassName="inline-flex h-10 items-center justify-center rounded-lg px-2 text-slate-600 transition-colors hover:bg-slate-100 hover:text-blue-600 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-blue-400 md:px-3" />
                        <TableOfContentsShelf novelId={novelId} chapters={chapters} currentChapterId={chapterId} isOpen={isTocOpen} onOpenChange={setIsTocOpen} showLabel triggerClassName="inline-flex h-10 items-center justify-center rounded-lg px-2 text-slate-600 transition-colors hover:bg-slate-100 hover:text-blue-600 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-blue-400 md:px-3" />
                    </nav>
                </div>
            </header>

            <div className={`${readerThemeClass} min-h-screen bg-[var(--reader-background)] text-[var(--reader-foreground)] transition-colors`}>
                <div
                    ref={readerRef}
                    className="mx-auto max-w-3xl touch-manipulation px-5 pb-16 pt-20 md:px-8 md:pb-20 md:pt-28"
                    onClick={handleReaderClick}
                >
                    {children}
                    {chapterEndNav}
                </div>
            </div>

            {/* พี่น้องกับส่วนอ่าน ไม่ได้อยู่ข้างใน: แตะตรงนี้ event จึงไม่ไปถึง handleReaderClick */}
            {comments && (
                <div ref={commentsRef} className="bg-black text-slate-100">
                    <div className="mx-auto max-w-3xl px-5 pb-28 pt-10 md:px-8">{comments}</div>
                </div>
            )}

            <footer className={`fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 shadow-sm backdrop-blur transition-all duration-300 dark:border-slate-800 dark:bg-black/95 ${barVisibilityClass}`} style={{ transform: controlsVisible ? undefined : 'translateY(100%)' }}>
                <div className="mx-auto box-content flex h-16 max-w-5xl items-center gap-3 px-4 pb-[env(safe-area-inset-bottom)] md:px-8">
                    {previousChapter ? <Link href={`/novel/${novelId}/chapter/${previousChapter.id}`} className="inline-flex h-11 min-w-11 shrink-0 items-center justify-center rounded-lg px-3 text-sm font-medium md:h-10 text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"><span aria-hidden="true">←</span><span className="ml-1 hidden sm:inline">ตอนก่อนหน้า</span></Link> : <button disabled className="inline-flex h-11 min-w-11 shrink-0 items-center justify-center rounded-lg px-3 text-sm font-medium md:h-10 text-slate-400 dark:text-slate-600"><span aria-hidden="true">←</span><span className="ml-1 hidden sm:inline">ตอนก่อนหน้า</span></button>}

                    <div className="flex min-w-0 flex-1 items-center gap-2">
                        <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700" role="progressbar" aria-label="ความคืบหน้าการอ่าน" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.floor(progress * 100)}>
                            <div className="h-full rounded-full bg-blue-500 transition-[width] duration-150" style={{ width: `${progress * 100}%` }} />
                        </div>
                        <span className="w-10 shrink-0 text-right text-xs font-medium tabular-nums text-slate-500 dark:text-slate-400">
                            {Math.floor(progress * 100)}%
                        </span>
                    </div>

                    {nextChapter ? <Link href={`/novel/${novelId}/chapter/${nextChapter.id}`} className="inline-flex h-11 min-w-11 shrink-0 items-center justify-center rounded-lg bg-blue-500 px-3 text-sm font-medium text-white transition-colors hover:bg-blue-600 md:h-10"><span className="mr-1 hidden sm:inline">ตอนถัดไป</span><span aria-hidden="true">→</span></Link> : <button disabled className="inline-flex h-11 min-w-11 shrink-0 items-center justify-center rounded-lg bg-slate-200 px-3 text-sm font-medium text-slate-400 md:h-10 dark:bg-slate-800 dark:text-slate-600"><span className="mr-1 hidden sm:inline">ตอนถัดไป</span><span aria-hidden="true">→</span></button>}
                </div>
            </footer>
        </div>
    )
}
