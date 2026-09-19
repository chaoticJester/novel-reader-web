'use client'

import { useCallback, useEffect, useRef, useState, type MouseEvent, type PointerEvent, type ReactNode } from 'react'
import Link from 'next/link'
import ReaderSettings from '@/components/ReaderSettings'
import TableOfContentsShelf from '@/components/TableOfContentsShelf'

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
}

const SCROLL_THRESHOLD = 12
const DOUBLE_TAP_DELAY = 350

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
}: ReaderNavigationProps) {
    const [isNavigationVisible, setIsNavigationVisible] = useState(true)
    const [isSettingsOpen, setIsSettingsOpen] = useState(false)
    const [isTocOpen, setIsTocOpen] = useState(false)
    const [progress, setProgress] = useState(0)
    const lastScrollYRef = useRef(0)
    const animationFrameRef = useRef<number | null>(null)
    const lastTouchTapRef = useRef(0)

    const panelIsOpen = isSettingsOpen || isTocOpen
    const controlsVisible = isNavigationVisible || panelIsOpen

    const getProgress = useCallback(() => {
        const doc = document.documentElement
        const scrollTop = window.scrollY || doc.scrollTop || document.body.scrollTop || 0
        const scrollHeight = Math.max(doc.scrollHeight, document.body.scrollHeight)
        const viewport = window.innerHeight || doc.clientHeight
        const maxScroll = scrollHeight - viewport
        if (maxScroll <= 0) return 0
        return Math.min(1, Math.max(0, scrollTop / maxScroll))
    }, [])

    const applyProgress = useCallback(() => {
        const next = getProgress()
        setProgress((current) => (Math.abs(current - next) > 0.001 ? next : current))
    }, [getProgress])

    // เปลี่ยนตอน: แสดงแถบเมนู ปิดพาเนล และคำนวณความคืบหน้าใหม่
    useEffect(() => {
        setIsNavigationVisible(true)
        setIsSettingsOpen(false)
        setIsTocOpen(false)
        lastScrollYRef.current = window.scrollY
        applyProgress()
    }, [applyProgress, chapterId])

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

    const handleDoubleClick = (event: MouseEvent<HTMLDivElement>) => {
        if (isInteractiveTarget(event.target) || Date.now() - lastTouchTapRef.current < DOUBLE_TAP_DELAY) return
        toggleNavigation()
    }

    const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
        if (event.pointerType !== 'touch' || isInteractiveTarget(event.target)) return

        const now = Date.now()
        if (now - lastTouchTapRef.current <= DOUBLE_TAP_DELAY) {
            // Keep this timestamp briefly so a browser-synthesized dblclick
            // from the same touch gesture cannot toggle the bars a second time.
            lastTouchTapRef.current = now
            if (event.cancelable) event.preventDefault()
            toggleNavigation()
            return
        }
        lastTouchTapRef.current = now
    }

    const barVisibilityClass = controlsVisible ? 'translate-y-0 opacity-100' : 'pointer-events-none opacity-0'

    return (
        <div className="min-h-screen" data-novel-id={novelId} data-chapter-id={chapterId}>
            <header className={`fixed inset-x-0 top-0 z-30 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur transition-all duration-300 dark:border-slate-700 dark:bg-slate-900/95 ${barVisibilityClass}`} style={{ transform: controlsVisible ? undefined : 'translateY(-100%)' }}>
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

            <div className="mx-auto max-w-3xl touch-manipulation px-4 pb-24 pt-24 md:px-8 md:pb-28 md:pt-28" onDoubleClick={handleDoubleClick} onPointerUp={handlePointerUp}>
                {children}
            </div>

            <footer className={`fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 shadow-sm backdrop-blur transition-all duration-300 dark:border-slate-700 dark:bg-slate-900/95 ${barVisibilityClass}`} style={{ transform: controlsVisible ? undefined : 'translateY(100%)' }}>
                <div className="mx-auto flex h-16 max-w-5xl items-center gap-3 px-4 pb-[env(safe-area-inset-bottom)] md:px-8">
                    {previousChapter ? <Link href={`/novel/${novelId}/chapter/${previousChapter.id}`} className="inline-flex h-10 shrink-0 items-center justify-center rounded-lg px-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"><span aria-hidden="true">←</span><span className="ml-1 hidden sm:inline">ตอนก่อนหน้า</span></Link> : <button disabled className="inline-flex h-10 shrink-0 items-center justify-center rounded-lg px-3 text-sm font-medium text-slate-400 dark:text-slate-600"><span aria-hidden="true">←</span><span className="ml-1 hidden sm:inline">ตอนก่อนหน้า</span></button>}

                    <div className="flex min-w-0 flex-1 items-center gap-2">
                        <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700" role="progressbar" aria-label="ความคืบหน้าการอ่าน" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)}>
                            <div className="h-full rounded-full bg-blue-500 transition-[width] duration-150" style={{ width: `${progress * 100}%` }} />
                        </div>
                        <span className="w-10 shrink-0 text-right text-xs font-medium tabular-nums text-slate-500 dark:text-slate-400">
                            {Math.round(progress * 100)}%
                        </span>
                    </div>

                    {nextChapter ? <Link href={`/novel/${novelId}/chapter/${nextChapter.id}`} className="inline-flex h-10 shrink-0 items-center justify-center rounded-lg bg-blue-500 px-3 text-sm font-medium text-white transition-colors hover:bg-blue-600"><span className="mr-1 hidden sm:inline">ตอนถัดไป</span><span aria-hidden="true">→</span></Link> : <button disabled className="inline-flex h-10 shrink-0 items-center justify-center rounded-lg bg-slate-200 px-3 text-sm font-medium text-slate-400 dark:bg-slate-800 dark:text-slate-600"><span className="mr-1 hidden sm:inline">ตอนถัดไป</span><span aria-hidden="true">→</span></button>}
                </div>
            </footer>
        </div>
    )
}
