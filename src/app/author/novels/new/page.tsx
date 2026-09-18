import NovelForm from '@/components/author/NovelForm'
import AuthorShell from '@/components/author/AuthorShell'
import { createNovel } from '../../actions'

export const instant = false

export default function NewNovelPage() {
    return (
        <AuthorShell width="editor" title="เริ่มเรื่องใหม่" description="วางรายละเอียดพื้นฐานและบันทึกเป็นฉบับร่างได้จนกว่าจะพร้อมเผยแพร่" backHref="/author" backLabel="กลับไปชั้นหนังสือ">
            <NovelForm
                action={createNovel}
                submitLabel="สร้างและเผยแพร่"
            />
        </AuthorShell>
    )
}
