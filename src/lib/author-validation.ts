export type NovelInput = {
    title: string
    author_name: string | null
    description: string | null
    publication_status: PublicationStatus
}

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
    }
}

export function parseChapterForm(
    formData: FormData,
): ChapterInput {
    const title = optionalText(formData.get('title'))
    const content = optionalText(formData.get('content'))
    const rawChapterNumber = formData.get('chapter_number')
    const chapterNumber = Number(rawChapterNumber)

    if (!title) {
        throw new Error('กรุณากรอกชื่อตอน')
    }

    if (!Number.isInteger(chapterNumber) || chapterNumber < 1) {
        throw new Error('หมายเลขตอนต้องเป็นจำนวนเต็มตั้งแต่ 1 ขึ้นไป')
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
