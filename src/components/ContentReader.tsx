'use client'

import ReactMarkdown from 'react-markdown'
import { useReaderSettings } from './ReaderSettingsProvider'

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

  return (
    <div
      className={`${fontClassName} text-slate-800 dark:text-slate-200 leading-loose whitespace-pre-wrap min-h-[40vh] transition-all duration-300 ease-in-out`}
      style={{ fontSize: `${fontSize}px` }}
    >
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  )
}
