'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { getReadChapters, READ_CHAPTERS_EVENT } from '@/lib/read-chapters'

interface Chapter {
  id: string
  title: string
  chapter_number: number
  created_at: string
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
  const [readChapters, setReadChapters] = useState<string[]>([])
  useEffect(() => setMounted(true), [])
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
  const isOpen = controlledIsOpen ?? uncontrolledIsOpen
  const setIsOpen = (next: boolean) => {
    if (controlledIsOpen === undefined) setUncontrolledIsOpen(next)
    onOpenChange?.(next)
  }

  // สถานะสำหรับ animation: render ลิ้นชักไว้ชั่วครู่หลังปิดเพื่อให้เลื่อนออกจนสุด
  const [isRendered, setIsRendered] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  useEffect(() => {
    if (isOpen) {
      setIsRendered(true)
      // เลื่อนเข้าในเฟรมถัดไป เพื่อให้ transition ทำงาน
      const id = window.requestAnimationFrame(() =>
        window.requestAnimationFrame(() => setIsVisible(true))
      )
      return () => window.cancelAnimationFrame(id)
    } else {
      setIsVisible(false)
      // รอ animation เลื่อนออกจบก่อนค่อยถอด element ออก
      const timer = window.setTimeout(() => setIsRendered(false), 300)
      return () => window.clearTimeout(timer)
    }
  }, [isOpen])

  // เรียงตอนจากมากไปน้อย (ตอนล่าสุดอยู่บนสุด)
  const sortedChapters = useMemo(
    () => [...chapters].sort((a, b) => b.chapter_number - a.chapter_number),
    [chapters]
  )

  // เลื่อนไปยังตอนปัจจุบันหลังลิ้นชักสไลด์เข้ามาเรียบร้อยแล้ว
  const currentItemRef = useRef<HTMLAnchorElement | null>(null)
  useEffect(() => {
    if (!isVisible) return
    // รอให้ animation สไลด์เข้าจบก่อน แล้วค่อยเลื่อนลงหาตอนปัจจุบัน
    const timer = window.setTimeout(() => {
      currentItemRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    }, 320)
    return () => window.clearTimeout(timer)
  }, [isVisible])

  return (
    <>
      {/* ปุ่มสารบัญ */}
      <button 
        onClick={() => setIsOpen(true)}
        aria-label="สารบัญ"
        className={triggerClassName ?? 'text-gray-500 hover:text-blue-500 dark:hover:text-blue-400 font-medium transition-colors flex items-center gap-2 px-4 py-2'}
      >
        <svg xmlns="http://www.w3.org/2000/svg"  width="16" height="16" viewBox="0 0 155 136" fill="currentColor" stroke ="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="0"  y="0"   width="30"  height="18" rx="9"/>
          <rect x="47" y="0"   width="108" height="18" rx="9"/>
          <rect x="0"  y="59"  width="30"  height="18" rx="9"/>
          <rect x="47" y="59"  width="108" height="18" rx="9"/>
          <rect x="0"  y="118" width="30"  height="18" rx="9"/>
          <rect x="47" y="118" width="108" height="18" rx="9"/>
        </svg>
        {showLabel && <span className="hidden md:inline" style={{marginLeft: 8}}>สารบัญ</span>}
      </button>

      {/* ฉากหลังสีดำจางๆ (Backdrop) — portal ออกไปที่ body เพื่อไม่ให้ติดอยู่ใน header ที่มี transform */}
      {isRendered && mounted && createPortal(
        <div
          className={`fixed inset-0 z-40 flex justify-end bg-black/50 transition-opacity duration-300 ${
            isVisible ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={() => setIsOpen(false)} // กดพื้นที่ว่างเพื่อปิด
        >
          <div
            className={`z-50 flex h-full w-full max-w-sm flex-col bg-white shadow-xl transition-transform duration-300 ease-out dark:bg-slate-900 md:w-1/2 lg:w-2/5 xl:w-1/3 ${
              isVisible ? 'translate-x-0' : 'translate-x-full'
            }`}
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
                      className={`vertical-align: middle min-w-0 items-baseline gap-2 rounded-lg border p-4 transition-colors ${
                        isCurrent
                          ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800'
                          : 'bg-white border-gray-100 hover:border-blue-300 dark:bg-slate-800 dark:border-slate-700'
                      }`}
                    >
                      <p
                        title={`ตอนที่ ${ch.chapter_number}`}
                        className={`shrink-0 whitespace-nowrap font-medium tabular-nums truncate ${readChapters.includes(ch.id) ? 'text-gray-800 dark:text-gray-600' : isCurrent ? 'text-blue-600 dark:text-blue-200' : 'text-gray-700 dark:text-gray-300'}`}
                      >
                        ตอนที่ {ch.chapter_number} : {ch.title}
                      </p>
                      <p className={`min-w-0 flex-1 truncate ${isCurrent ? 'text-blue-700 dark:text-blue-400 font-medium' : 'text-gray-500'}`}>
                        {new Date(ch.created_at).toLocaleDateString('th-TH')}
                      </p>
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
