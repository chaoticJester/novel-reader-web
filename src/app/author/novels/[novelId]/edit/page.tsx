import Link from 'next/link'
import { notFound } from 'next/navigation'
import NovelForm from '@/components/author/NovelForm'
import AuthorShell from '@/components/author/AuthorShell'
import DeleteButton from '@/components/author/DeleteButton'
import StatusBadge from '@/components/author/StatusBadge'
import { supabaseAdmin } from '@/lib/supabase-admin'
import {
    deleteChapter,
    updateNovel,
} from '../../../actions'

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
            .select('id, title, author_name, description, cover_image_url, publication_status')
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

    return (
        <AuthorShell width="editor" title={novelResult.data.title} description="ปรับรายละเอียดนิยายและจัดการทุกตอนในที่เดียว" backHref="/author" backLabel="กลับไปชั้นหนังสือ">
            <NovelForm
                novel={novelResult.data}
                action={updateNovel.bind(null, novelId)}
                submitLabel="บันทึกและเผยแพร่"
            />

            <section className="mt-12">
                <div className="mb-5 flex items-end justify-between gap-4">
                    <div>
                        <p className="text-xs font-bold tracking-[0.18em] text-indigo-600 dark:text-indigo-400">CHAPTERS</p>
                        <h2 className="mt-2 text-2xl font-black">รายชื่อตอน</h2>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{chaptersResult.data?.length ?? 0} ตอนในนิยายเรื่องนี้</p>
                    </div>

                    <Link
                        href={`/author/novels/${novelId}/chapters/new`}
                        className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 transition hover:-translate-y-0.5 hover:bg-indigo-500"
                    >
                        <span className="text-lg leading-none">＋</span> เพิ่มตอน
                    </Link>
                </div>

                <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-white/10 dark:bg-slate-900/80">
                    {chaptersResult.data?.map((chapter) => (
                        <div
                            key={chapter.id}
                            className="flex flex-col gap-3 border-b border-slate-200/80 px-5 py-4 last:border-0 sm:flex-row sm:items-center sm:justify-between dark:border-white/10"
                        >
                            <div className="flex min-w-0 items-center gap-4">
                                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-slate-100 text-sm font-black text-slate-600 dark:bg-white/5 dark:text-slate-300">{chapter.chapter_number}</span>
                                <div className="min-w-0">
                                    <p className="truncate font-bold">{chapter.title}</p>
                                    <div className="mt-1"><StatusBadge status={chapter.publication_status} /></div>
                                </div>
                            </div>

                            <div className="flex items-center gap-1 self-end sm:self-auto">
                                <Link
                                    href={`/author/novels/${novelId}/chapters/${chapter.id}/edit`}
                                    className="rounded-lg px-3 py-2 text-sm font-bold text-indigo-600 transition hover:bg-indigo-50 dark:text-indigo-300 dark:hover:bg-indigo-400/10"
                                >
                                    แก้ไข
                                </Link>
                                <DeleteButton compact action={deleteChapter.bind(null, novelId, chapter.id)} message={`ลบตอนที่ ${chapter.chapter_number} “${chapter.title}” อย่างถาวรหรือไม่?`} />
                            </div>
                        </div>
                    ))}
                    {!chaptersResult.data?.length && <p className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">ยังไม่มีตอน เริ่มเขียนตอนแรกได้เลย</p>}
                </div>
            </section>
        </AuthorShell>
    )
}
