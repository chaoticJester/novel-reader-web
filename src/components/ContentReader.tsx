'use client'

import ReactMarkdown from 'react-markdown'
import { useReaderSettings } from './ReaderSettingsProvider'
import remarkRuby from '@/lib/remark-ruby'
import remarkSceneBreak from '@/lib/remark-scene-break'

interface Font {
  key: string
  label: string
  className: string
}

interface ContentReaderProps {
  content: string
  fonts: Font[]
}

export default function ContentReader({ content, fonts }: ContentReaderProps) {
  const { fontKey, fontSize } = useReaderSettings()
  const fontClassName = fonts.find((f) => f.key === fontKey)?.className ?? ''
  // Markdown ตัดเว้นวรรค/Tab ต้นบรรทัดทิ้ง (และมอง Tab หรือ 4 ช่องเป็น code block)
  // ใส่ zero-width space นำหน้าไว้ ช่องว่างที่ผู้เขียนพิมพ์จึงถูกส่งต่อไปแสดงผลตามจริงด้วย whitespace-pre-wrap
  const preservedContent = content.replace(/^(?=[ \t]+\S)/gm, '​')

  return (
    <div
      className={`reader-content ruby-text ${fontClassName} min-h-[40vh] whitespace-pre-wrap text-[var(--reader-foreground)] transition-all duration-300 ease-in-out leading-loose`}
      style={{ fontSize: `${fontSize}px` }}
    >
      <ReactMarkdown remarkPlugins={[remarkRuby, remarkSceneBreak]}>{preservedContent}</ReactMarkdown>
    </div>
  )
}
