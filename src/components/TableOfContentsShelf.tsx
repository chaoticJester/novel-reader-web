'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'

interface Chapter {
  id: string
  title: string
  chapter_number: number
}

interface TableOfContentsShelfProps {
  novelId: string
  chapters: Chapter[]
  currentChapterId: string
  triggerClassName?: string
  showLabel?: boolean
  isOpen?: boolean
  onOpenChange?: (isOpen: boolean) => void
}

export default function TableOfContentsShelf({
  novelId,
  chapters,
  currentChapterId,
  triggerClassName,
  showLabel = true,
  isOpen: controlledIsOpen,
  onOpenChange,
}: TableOfContentsShelfProps) {
  const [uncontrolledIsOpen, setUncontrolledIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const isOpen = controlledIsOpen ?? uncontrolledIsOpen
  const setIsOpen = (next: boolean) => {
    if (controlledIsOpen === undefined) setUncontrolledIsOpen(next)
    onOpenChange?.(next)
  }

  // เรียงตอนจากมากไปน้อย (ตอนล่าสุดอยู่บนสุด)
  const sortedChapters = useMemo(
    () => [...chapters].sort((a, b) => b.chapter_number - a.chapter_number),
    [chapters]
  )

  // เลื่อนไปยังตอนปัจจุบันเมื่อเปิดสารบัญ
  const currentItemRef = useRef<HTMLAnchorElement | null>(null)
  useEffect(() => {
    if (!isOpen) return
    const id = window.requestAnimationFrame(() => {
      currentItemRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    })
    return () => window.cancelAnimationFrame(id)
  }, [isOpen])

  return (
    <>
      {/* ปุ่มสารบัญ */}
      <button 
        onClick={() => setIsOpen(true)}
        aria-label="สารบัญ"
        className={triggerClassName ?? 'text-gray-500 hover:text-blue-500 dark:hover:text-blue-400 font-medium transition-colors flex items-center gap-2 px-4 py-2'}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="12" x2="21" y2="12"></line>
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
        {showLabel && <span className="hidden md:inline">สารบัญ</span>}
      </button>

      {/* ฉากหลังสีดำจางๆ (Backdrop) — portal ออกไปที่ body เพื่อไม่ให้ติดอยู่ใน header ที่มี transform */}
      {isOpen && mounted && createPortal(
        <div
          className="fixed inset-0 z-40 flex justify-end bg-black/50 transition-opacity"
          onClick={() => setIsOpen(false)} // กดพื้นที่ว่างเพื่อปิด
        >
          <div 
            className="z-50 flex h-full w-full max-w-sm flex-col bg-white shadow-xl transition-transform dark:bg-slate-900 md:w-1/2 lg:w-2/5 xl:w-1/3"
            onClick={(e) => e.stopPropagation()} // ป้องกันการกดทะลุไปโดนฉากหลัง
          >
            {/* หัวกล่อง */}
            <div className="flex justify-between items-center p-4 border-b border-gray-100 dark:border-gray-800">
              <h3 className="font-bold text-lg dark:text-white">รายชื่อตอนทั้งหมด</h3>
              <button 
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 flex items-center justify-center bg-gray-100 dark:bg-slate-800 rounded-full text-gray-500 hover:text-red-500"
              >
                ✕
              </button>
            </div>

            {/* รายชื่อตอน (เลื่อนได้) */}
            <div className="overflow-y-auto p-4 flex-1">
              <div className="flex flex-col gap-2">
                {sortedChapters.map((ch) => {
                  const isCurrent = ch.id === currentChapterId
                  return (
                    <Link
                      key={ch.id}
                      ref={isCurrent ? currentItemRef : undefined}
                      href={`/novel/${novelId}/chapter/${ch.id}`}
                      onClick={() => setIsOpen(false)} // กดเลือกตอนแล้วปิดกล่อง
                      className={`flex min-w-0 items-baseline gap-2 rounded-lg border p-4 transition-colors ${
                        isCurrent
                          ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800'
                          : 'bg-white border-gray-100 hover:border-blue-300 dark:bg-slate-800 dark:border-slate-700'
                      }`}
                    >
                      <span
                        title={`ตอนที่ ${ch.chapter_number}`}
                        className={`shrink-0 whitespace-nowrap font-medium tabular-nums ${isCurrent ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500'}`}
                      >
                        ตอนที่ {ch.chapter_number}
                      </span>
                      <span className={`min-w-0 flex-1 truncate ${isCurrent ? 'text-blue-700 dark:text-blue-300 font-medium' : 'text-gray-700 dark:text-gray-300'}`}>
                        {ch.title}
                      </span>
                    </Link>
                  )
                })}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
