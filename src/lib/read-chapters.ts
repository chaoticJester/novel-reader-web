export const READ_CHAPTERS_EVENT = 'read-chapters-changed'

const PREFIX = 'read-chapters:'
const PENDING_KEY = 'read-chapters-pending' // ตอนที่อ่านแล้วแต่ยังไม่ได้ส่งถึง DB
const key = (novelId: string) => `${PREFIX}${novelId}`

function notify() {
    window.dispatchEvent(new Event(READ_CHAPTERS_EVENT))
}

function readStringArray(storageKey: string): string[] | null {
    const raw = localStorage.getItem(storageKey)
    if (raw === null) return null
    const value = JSON.parse(raw)
    return Array.isArray(value) ? value.filter((id): id is string => typeof id === 'string') : []
}

// ---------- อ่าน/เขียนรายเรื่อง ----------

export function getReadChapters(novelId: string): string[] {
    try {
        return readStringArray(key(novelId)) ?? []
    } catch {
        return []
    }
}

export function setChapterRead(novelId: string, chapterId: string, read: boolean) {
    const chapters = new Set(getReadChapters(novelId))
    if (read) chapters.add(chapterId)
    else chapters.delete(chapterId)
    try {
        localStorage.setItem(key(novelId), JSON.stringify([...chapters]))
        notify()
    } catch {
        // Reading remains available when browser storage is disabled.
    }
}

// แทนที่ทั้งเรื่องด้วยค่าจาก DB (หลังกด − / + ในชั้นหนังสือ)
export function replaceReadChapters(novelId: string, chapterIds: string[]) {
    try {
        localStorage.setItem(key(novelId), JSON.stringify(chapterIds))
        notify()
    } catch {}
}

// แทนที่ทุกเรื่องด้วยค่าจาก DB (หลัง sync): เรื่องที่ไม่มีใน DB แล้วถูกลบออกจากเครื่องด้วย
export function replaceAllReadChapters(readsByNovel: Record<string, string[]>) {
    try {
        const staleKeys: string[] = []
        for (let i = 0; i < localStorage.length; i++) {
            const storageKey = localStorage.key(i)
            if (storageKey?.startsWith(PREFIX)) staleKeys.push(storageKey)
        }
        // เก็บ key ไว้ก่อนค่อยลบ: ลบระหว่างวน loop จะทำให้ index เลื่อนแล้วข้ามบาง key
        staleKeys.forEach((storageKey) => localStorage.removeItem(storageKey))

        for (const [novelId, chapterIds] of Object.entries(readsByNovel)) {
            localStorage.setItem(key(novelId), JSON.stringify(chapterIds))
        }
        notify()
    } catch {}
}

export function getAllReadChapterIds(): string[] {
    const ids: string[] = []
    try {
        for (let i = 0; i < localStorage.length; i++) {
            const storageKey = localStorage.key(i)
            if (storageKey?.startsWith(PREFIX)) {
                ids.push(...getReadChapters(storageKey.slice(PREFIX.length)))
            }
        }
    } catch {}
    return ids
}

// ---------- คิวรอส่ง ----------

// null = ยังไม่เคยมีคิว (เครื่องที่ใช้งานมาก่อนมีระบบนี้) → ให้ส่งทุกตอนในเครื่องแทน
export function getPendingReads(): string[] | null {
    try {
        return readStringArray(PENDING_KEY)
    } catch {
        return []
    }
}

export function addPendingRead(chapterId: string) {
    try {
        const pending = new Set(getPendingReads() ?? [])
        pending.add(chapterId)
        localStorage.setItem(PENDING_KEY, JSON.stringify([...pending]))
    } catch {}
}

// ลบเฉพาะตัวที่ส่งไปแล้ว: ถ้ามีตอนใหม่เข้าคิวระหว่างรอ sync จะไม่หายไปด้วย
export function removePendingReads(sentIds: string[]) {
    try {
        const sent = new Set(sentIds)
        const remaining = (getPendingReads() ?? []).filter((id) => !sent.has(id))
        localStorage.setItem(PENDING_KEY, JSON.stringify(remaining))
    } catch {}
}