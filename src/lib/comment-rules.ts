export const MAX_COMMENT_LENGTH = 2000


export function commentLength(text: string): number {
    return Array.from(text).length
}

// ?comments=N → จำนวนหน้าที่แสดง (1–20) ค่าแปลก/ไม่มี = 1
// มีเพดานเพราะใครก็พิมพ์ URL ได้: ไม่จำกัด = สั่ง server ดึงไม่อั้น และถม cache ด้วยค่าต่างๆ ได้
export const MAX_COMMENT_PAGES = 20

export function parseCommentPages(value: string | string[] | undefined): number {
    const raw = Array.isArray(value) ? value[0] : value // ?comments=2&comments=5 → ใช้ตัวแรก
    const pages = Number.parseInt(raw ?? '', 10)
    if (!Number.isFinite(pages) || pages < 1) return 1
    return Math.min(pages, MAX_COMMENT_PAGES)
}
