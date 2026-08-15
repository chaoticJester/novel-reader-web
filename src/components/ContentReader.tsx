'use client'

import { useState } from 'react'
import ReactMarkdown from 'react-markdown'

interface ContentReaderProps {
  content: string;
  fontClassName: string;
}

export default function ContentReader({ content, fontClassName }: ContentReaderProps) {
  // สร้าง State สำหรับเก็บขนาดฟอนต์ (ตั้งค่าเริ่มต้นที่ 18px)
  const [fontSize, setFontSize] = useState(20)

  // ฟังก์ชันเพิ่ม-ลดขนาดฟอนต์ (จำกัดไม่ให้เล็กกว่า 12px และใหญ่กว่า 32px)
  const decreaseFont = () => setFontSize(prev => (prev > 12 ? prev - 2 : prev))
  const resetFont = () => setFontSize(20)
  const increaseFont = () => setFontSize(prev => (prev < 32 ? prev + 2 : prev))

  return (
    <div className="w-full">
      {/* ส่วนปุ่มควบคุมขนาดฟอนต์ (จัดให้อยู่ชิดขวา) */}
      <div className="flex justify-end items-center gap-2 mb-6">
        <span className="text-sm text-gray-500 mr-2">ขนาดอักษร:</span>
        <button 
          onClick={decreaseFont}
          className="w-10 h-10 flex items-center justify-center bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition-colors font-medium"
        >
          A-
        </button>
        <button 
          onClick={resetFont}
          className="w-10 h-10 flex items-center justify-center bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition-colors font-medium"
        >
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
            >
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
            </svg>
        </button>
        <button 
          onClick={increaseFont}
          className="w-10 h-10 flex items-center justify-center bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition-colors font-medium text-lg"
        >
          A+
        </button>
      </div>

      {/* ส่วนเนื้อหา */}
      {/* ใช้ style={{ fontSize: ... }} เพื่อให้ขนาดเปลี่ยนไปตามค่าตัวเลขที่เรากด */}
      <div 
        className={`${fontClassName} text-slate-800 dark:text-slate-200 leading-loose whitespace-pre-wrap min-h-[40vh] transition-all duration-300 ease-in-out`}
        style={{ fontSize: `${fontSize}px` }}
      >
        <ReactMarkdown>
           {content}
        </ReactMarkdown>
      </div>
    </div>
  )
}