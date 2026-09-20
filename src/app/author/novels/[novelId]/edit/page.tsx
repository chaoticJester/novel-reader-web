import Link from 'next/link'
import { notFound } from 'next/navigation'
import NovelForm from '@/components/author/NovelForm'
import AuthorShell from '@/components/author/AuthorShell'
import ChapterList from '@/components/author/ChapterList'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { updateNovel } from '../../../actions'

export const instant = false

export default async function EditNovelPage({
    params,
}: {
    params: Promise<{ novelId: string }>
}) {
    const { novelId } = await params

    const [novelResult, chaptersResult] = await Promise.all([
        supabaseAdmin
            .from('novels')
            .select(
                'id, title, author_name, description, cover_image_url, publication_status'
            )
            .eq('id', novelId)
            .single(),

        supabaseAdmin
            .from('chapters')
            .select('id, title, chapter_number, publication_status')
            .eq('novel_id', novelId)
            .order('chapter_number'),
    ])

    if (novelResult.error || !novelResult.data) {
        notFound()
    }

    if (chaptersResult.error) {
        throw new Error(chaptersResult.error.message)
    }

    const chapters = chaptersResult.data ?? []

    return (
        <AuthorShell
            width="editor"
            title={novelResult.data.title}
            description="ปรับรายละเอียดนิยายและจัดการทุกตอนในที่เดียว"
            backHref="/author"
            backLabel="กลับไปชั้นหนังสือ"
        >
            <NovelForm
                novel={novelResult.data}
                action={updateNovel.bind(null, novelId)}
                submitLabel="บันทึกและเผยแพร่"
            />

            <section className="mt-12 w-full">
                <ChapterList
                    chapters={chapters}
                    novelId={novelId}
                />
            </section>
        </AuthorShell>
    )
}
