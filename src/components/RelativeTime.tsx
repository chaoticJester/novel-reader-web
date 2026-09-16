'use client'

import { useEffect, useState } from "react"
import {formatRelativeTime} from '@/lib/relativeTime'

export default function RelativeTime({iso}: {iso: string}) {
  const [text, setText] = useState('')

  useEffect(() => {
    setText(formatRelativeTime(iso))

    const id = setInterval(() => setText(formatRelativeTime(iso)), 60_000)
    return () => clearInterval(id)
  }, [iso])

  return (
    <time dateTime={iso} suppressHydrationWarning>
      {text}
    </time>
  )
}
