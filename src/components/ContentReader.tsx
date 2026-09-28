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
      className={`${fontClassName} min-h-[40vh] whitespace-pre-wrap text-[var(--reader-foreground)] transition-all duration-300 ease-in-out leading-loose`}
      style={{ fontSize: `${fontSize}px` }}
    >
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  )
}
