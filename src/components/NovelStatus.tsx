'use client'

import { NOVEL_STATUS_STYLES, isNovelStatus } from '@/lib/novel-status'

export default function NovelStatus({ novelStatus }: { novelStatus: string }) {
  if (!isNovelStatus(novelStatus)) return null; // unknown status → render nothing

  const status = NOVEL_STATUS_STYLES[novelStatus];

  return (
    <div
      className="rounded-full px-3 py-1 text-sm border"
      style={{
        borderColor: status.color,
        color: status.color,
        backgroundColor: `${status.color}33`, // same color at ~20% opacity
        boxShadow: `0 0 1px ${status.color}, 0 0 5px ${status.color}`,
        maxWidth: "250px",
      }}
    >
      {status.label}
    </div>
  );
}
