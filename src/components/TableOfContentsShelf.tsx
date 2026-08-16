'use client'

import { useState } from 'react'
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
}

export default function TableOfContentsShelf({ novelId, chapters, currentChapterId }: TableOfContentsShelfProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* ปุ่มสารบัญ */}
      <button 
        onClick={() => setIsOpen(true)}
        className="text-gray-500 hover:text-blue-500 dark:hover:text-blue-400 font-medium transition-colors flex items-center gap-2 px-4 py-2"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="12" x2="21" y2="12"></line>
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
        สารบัญ
      </button>

      {/* ฉากหลังสีดำจางๆ (Backdrop) */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 flex items-end sm:items-center justify-center p-0 sm:p-4 transition-opacity"
          onClick={() => setIsOpen(false)} // กดพื้นที่ว่างเพื่อปิด
        >
          {/* ตัวกล่อง Shelf */}
          <div 
            className="bg-white dark:bg-slate-900 w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl max-h-[70vh] flex flex-col shadow-xl z-50 transform transition-transform"
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
                {chapters.map((ch) => {
                  const isCurrent = ch.id === currentChapterId
                  return (
                    <Link
                      key={ch.id}
                      href={`/novel/${novelId}/chapter/${ch.id}`}
                      onClick={() => setIsOpen(false)} // กดเลือกตอนแล้วปิดกล่อง
                      className={`p-3 rounded-lg flex items-center border transition-colors ${
                        isCurrent 
                          ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800' 
                          : 'bg-white border-gray-100 hover:border-blue-300 dark:bg-slate-800 dark:border-slate-700'
                      }`}
                    >
                      <span className={`font-medium min-w-[60px] ${isCurrent ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500'}`}>
                        ตอนที่ {ch.chapter_number}
                      </span>
                      <span className={`line-clamp-1 ${isCurrent ? 'text-blue-700 dark:text-blue-300 font-medium' : 'text-gray-700 dark:text-gray-300'}`}>
                        {ch.title}
                      </span>
                    </Link>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}