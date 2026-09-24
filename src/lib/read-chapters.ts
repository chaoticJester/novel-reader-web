export const READ_CHAPTERS_EVENT = 'read-chapters-changed'

const key = (novelId: string) => `read-chapters:${novelId}`

export function getReadChapters(novelId: string): string[] {
    try {
        const value = JSON.parse(localStorage.getItem(key(novelId)) || '[]')
        return Array.isArray(value) ? value.filter((id): id is string => typeof id === 'string') : []
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
        window.dispatchEvent(new Event(READ_CHAPTERS_EVENT))
    } catch {
        // Reading remains available when browser storage is disabled.
    }
}
