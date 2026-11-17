import { isNovelStatus, type NovelStatusValue } from './novel-status'

export type NovelInput = {
    title: string
    author_name: string | null
    description: string | null
    publication_status: PublicationStatus
    status: NovelStatusValue
}

export type TagInput = {
    name: string
    slug: string
}

const MAX_TAGS = 20
const MAX_TAG_LENGTH = 50

export type ChapterInput = {
    title: string
    chapter_number: number
    content: string
    publication_status: PublicationStatus
}

export type PublicationStatus = 'draft' | 'published'

function publicationStatus(formData: FormData): PublicationStatus {
    return formData.get('publication_status') === 'published' ? 'published' : 'draft'
}

function optionalText(value: FormDataEntryValue | null) {
    if (typeof value !== 'string') {
        return null
    }

    const trimmed = value.trim()
    return trimmed || null
}

export function parseNovelForm(
    formData: FormData,
): NovelInput {
    const title = optionalText(formData.get('title'))

    if (!title) {
        throw new Error('กรุณากรอกชื่อนิยาย')
    }

    if (title.length > 200) {
        throw new Error('ชื่อนิยายยาวเกินไป')
    }

    return {
        title,
        author_name: optionalText(formData.get('author_name')),
        description: optionalText(formData.get('description')),
        publication_status: publicationStatus(formData),
        status: novelStatus(formData),
    }
}

function novelStatus(formData: FormData): NovelStatusValue {
    const value = formData.get('status')
    return isNovelStatus(value) ? value : 'ongoing'
}

// "Slow Burn" -> "slow-burn", "แฟนตาซี" -> "แฟนตาซี"
// \p{L} letters, \p{N} numbers, \p{M} marks (needed for Thai vowels/tone marks)
export function slugify(name: string) {
    return name
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\p{L}\p{N}\p{M}-]/gu, '')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
}

// "Fantasy, romance , fantasy" -> [{ name: 'Fantasy', slug: 'fantasy' }, { name: 'romance', slug: 'romance' }]
export function parseTagNames(formData: FormData): TagInput[] {
    const raw = formData.get('tags')

    if (typeof raw !== 'string') {
        return []
    }

    const bySlug = new Map<string, TagInput>()

    for (const part of raw.split(',')) {
        const name = part.trim().replace(/\s+/g, ' ')
        const slug = slugify(name)

        if (!slug) continue

        if (name.length > MAX_TAG_LENGTH) {
            throw new Error(`แท็ก "${name}" ยาวเกินไป (ไม่เกิน ${MAX_TAG_LENGTH} ตัวอักษร)`)
        }

        if (!bySlug.has(slug)) {
            bySlug.set(slug, { name, slug })
        }
    }

    if (bySlug.size > MAX_TAGS) {
        throw new Error(`ใส่แท็กได้ไม่เกิน ${MAX_TAGS} แท็ก`)
    }

    return [...bySlug.values()]
}

// ไม่ใช้ trim() เต็มๆ เพราะจะตัดย่อหน้า (เว้นวรรค/Tab) ของบรรทัดแรกทิ้ง
// ตัดแค่บรรทัดว่างด้านบนและช่องว่างท้ายเนื้อหา
function chapterContent(value: FormDataEntryValue | null) {
    if (typeof value !== 'string') {
        return null
    }

    const content = value.replace(/^(?:[ \t]*\r?\n)+/, '').trimEnd()
    return content.trim() ? content : null
}

export function parseChapterForm(
    formData: FormData,
): ChapterInput {
    const title = optionalText(formData.get('title'))
    const content = chapterContent(formData.get('content'))
    const rawChapterNumber = String(formData.get('chapter_number') ?? '').trim()
    const chapterNumber = Number(rawChapterNumber)

    if (!title) {
        throw new Error('กรุณากรอกชื่อตอน')
    }

    // Allows decimals such as 1.5 or 10.25 (up to 2 decimal places).
    if (
        !/^\d+(\.\d{1,2})?$/.test(rawChapterNumber) ||
        !Number.isFinite(chapterNumber) ||
        chapterNumber < 0
    ) {
        throw new Error('หมายเลขตอนต้องเป็น 0 ขึ้นไป และมีทศนิยมได้ไม่เกิน 2 ตำแหน่ง (เช่น 0, 1, 1.5, 10.25)')
    }

    if (!content) {
        throw new Error('กรุณากรอกเนื้อหาตอน')
    }

    return {
        title,
        chapter_number: chapterNumber,
        content,
        publication_status: publicationStatus(formData),
    }
}
