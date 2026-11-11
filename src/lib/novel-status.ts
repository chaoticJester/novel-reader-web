// Story progress of a novel (not the draft/published state).
// Shared by the reader badge (NovelStatus) and the author form.

export const NOVEL_STATUSES = ['ongoing', 'completed', 'hiatus', 'dropped'] as const

export type NovelStatusValue = (typeof NOVEL_STATUSES)[number]

export const NOVEL_STATUS_STYLES: Record<NovelStatusValue, { label: string; color: string }> = {
    ongoing:   { label: 'ยังไม่จบ',    color: '#39ff14' }, // neon green
    completed: { label: 'จบแล้ว',     color: '#1ea7ff' }, // blue
    hiatus:    { label: 'หยุดเขียน',   color: '#ffb300' }, // amber
    dropped:   { label: 'ไม่เขียนต่อ', color: '#ff3b3b' }, // red
}

export function isNovelStatus(value: unknown): value is NovelStatusValue {
    return typeof value === 'string' && (NOVEL_STATUSES as readonly string[]).includes(value)
}
