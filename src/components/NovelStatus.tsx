'use client'

import { NOVEL_STATUS_STYLES, isNovelStatus } from '@/lib/novel-status'

type Props = {
  novelStatus: string
  // "sm" for small spaces like the homepage cover
  size?: 'sm' | 'md'
  // true when the pill sits on top of a cover image: uses a dark backing so the text stays readable
  onImage?: boolean
  className?: string
}

const SIZE_CLASSES = {
  sm: 'px-2 py-0.5 text-[11px] leading-4',
  md: 'px-3 py-1 text-sm',
}

export default function NovelStatus({ novelStatus, size = 'md', onImage = false, className = '' }: Props) {
  if (!isNovelStatus(novelStatus)) return null; // unknown status → render nothing

  const status = NOVEL_STATUS_STYLES[novelStatus];

  return (
    <div
      className={`rounded-full border whitespace-nowrap ${SIZE_CLASSES[size]} ${className}`}
      style={{
        borderColor: status.color,
        color: status.color,
        // on a cover: mostly-black backing; elsewhere: same color at ~20% opacity
        backgroundColor: onImage ? 'rgba(0, 0, 0, 0.75)' : `${status.color}33`,
        boxShadow: `0 0 1px ${status.color}, 0 0 5px ${status.color}`,
        maxWidth: "250px",
      }}
    >
      {status.label}
    </div>
  );
}
