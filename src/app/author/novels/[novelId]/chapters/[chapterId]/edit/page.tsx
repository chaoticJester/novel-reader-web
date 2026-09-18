import { notFound } from 'next/navigation'
import ChapterForm from '@/components/author/ChapterForm'
import AuthorShell from '@/components/author/AuthorShell'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { updateChapter } from '../../../../../actions'

export const instant = false

export default async function EditChapterPage({
    params,
}: {
    params: Promise<{
        novelId: string
        chapterId: string
    }>
}) {
    const { novelId, chapterId } = await params

    const { data: chapter, error } = await supabaseAdmin
        .from('chapters')
        .select('id, title, chapter_number, content, publication_status')
        .eq('id', chapterId)
        .eq('novel_id', novelId)
        .single()

    if (error || !chapter) {
        notFound()
    }

    return (
        <AuthorShell width="editor" eyebrow={`ตอนที่ ${chapter.chapter_number}`} title={chapter.title} description="แก้ไขต้นฉบับและเลือกสถานะการเผยแพร่" backHref={`/author/novels/${novelId}/edit`} backLabel="กลับไปหน้าจัดการนิยาย">
            <ChapterForm
                chapter={chapter}
                action={updateChapter.bind(
                    null,
                    novelId,
                    chapterId,
                )}
                submitLabel="บันทึกและเผยแพร่"
            />
        </AuthorShell>
    )
}
