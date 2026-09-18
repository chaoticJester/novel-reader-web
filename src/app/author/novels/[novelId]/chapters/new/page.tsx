import ChapterForm from '@/components/author/ChapterForm'
import AuthorShell from '@/components/author/AuthorShell'
import { createChapter } from '../../../../actions'

export const instant = false

export default async function NewChapterPage({
    params,
}: {
    params: Promise<{ novelId: string }>
}) {
    const { novelId } = await params

    return (
        <AuthorShell width="editor" title="เขียนตอนใหม่" description="เก็บเป็นฉบับร่างเพื่อกลับมาเขียนต่อ หรือเผยแพร่ให้ผู้อ่านได้ทันที" backHref={`/author/novels/${novelId}/edit`} backLabel="กลับไปหน้าจัดการนิยาย">
            <ChapterForm
                action={createChapter.bind(null, novelId)}
                submitLabel="สร้างและเผยแพร่"
            />
        </AuthorShell>
    )
}
