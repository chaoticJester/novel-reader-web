import Link from 'next/link'
import AuthorShell from '@/components/author/AuthorShell'
import DeleteButton from '@/components/author/DeleteButton'
import StatusBadge from '@/components/author/StatusBadge'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { deleteNovel } from './actions'
import { logout } from './login/actions'
import ThemeToggle from '@/components/ThemeToggle'

export const instant = false

export default async function AuthorDashboard() {
    const { data: novels, error } = await supabaseAdmin
        .from('novels')
        .select('id, title, author_name, cover_image_url, publication_status, created_at, chapters(count)')
        .order('created_at', { ascending: false })

    if (error) throw new Error(error.message)

    const totalNovels = novels?.length ?? 0
    const drafts = novels?.filter((novel) => novel.publication_status === 'draft').length ?? 0
    const totalChapters = novels?.reduce((sum, novel) => sum + (novel.chapters?.[0]?.count ?? 0), 0) ?? 0

    return (
        <AuthorShell
            title="นิยายทั้งหมด"
            actions={(
                <>
                    <ThemeToggle />
                    <Link href="/" className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:border-indigo-300 hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">ดูหน้าเว็บไซต์</Link>
                    <form action={logout}><button className="px-3 py-2.5 text-sm font-bold text-slate-500 transition hover:text-rose-600 dark:text-slate-400">ออกจากระบบ</button></form>
                </>
            )}
        >
            <section className="mb-8 grid grid-cols-3 gap-3 sm:gap-4" aria-label="ภาพรวมงานเขียน">
                {[
                    { label: 'นิยายทั้งหมด', value: totalNovels, accent: 'text-indigo-600 dark:text-indigo-400' },
                    { label: 'ฉบับร่าง', value: drafts, accent: 'text-amber-600 dark:text-amber-400' },
                    { label: 'ตอนทั้งหมด', value: totalChapters, accent: 'text-sky-600 dark:text-sky-400' },
                ].map((item) => (
                    <div key={item.label} className="rounded-2xl border border-slate-200/80 bg-white/80 p-4 shadow-sm backdrop-blur sm:p-5 dark:border-white/10 dark:bg-slate-900/70">
                        <p className={`text-2xl font-black sm:text-3xl ${item.accent}`}>{item.value}</p>
                        <p className="mt-1 text-xs font-semibold text-slate-500 sm:text-sm dark:text-slate-400">{item.label}</p>
                    </div>
                ))}
            </section>

            <div className="mb-5 flex items-center justify-between">
                <h2 className="text-lg font-black">ผลงานล่าสุด</h2>
                <Link href="/author/novels/new" className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 transition hover:-translate-y-0.5 hover:bg-indigo-500">
                    <span className="text-lg leading-none">＋</span> เพิ่มนิยาย
                </Link>
            </div>

            <div className="space-y-4">
                {novels?.map((novel) => (
                    <article key={novel.id} className="group grid gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-100/50 sm:grid-cols-[72px_1fr_auto] sm:items-center dark:border-white/10 dark:bg-slate-900/80 dark:hover:border-indigo-500/30 dark:hover:shadow-black/20">
                        <div className="aspect-[3/4] w-[72px] overflow-hidden rounded-xl bg-gradient-to-br from-indigo-100 to-slate-200 dark:from-indigo-950 dark:to-slate-800">
                            {novel.cover_image_url ? <img src={novel.cover_image_url} alt="" className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-2xl text-indigo-400">✦</div>}
                        </div>

                        <div className="min-w-0">
                            <div className="mb-2 flex flex-wrap items-center gap-2">
                                <StatusBadge status={novel.publication_status} />
                                <span className="text-xs font-medium text-slate-400">{novel.chapters?.[0]?.count ?? 0} ตอน</span>
                            </div>
                            <h3 className="truncate text-lg font-black">{novel.title}</h3>
                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{novel.author_name || 'ไม่ระบุผู้แต่ง'}</p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                            {novel.publication_status === 'published' && <Link href={`/novel/${novel.id}`} className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-white/5 dark:hover:text-white">ดูหน้าเรื่อง</Link>}
                            <Link href={`/author/novels/${novel.id}/edit`} className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-bold text-white transition hover:bg-indigo-600 dark:bg-indigo-500 dark:hover:bg-indigo-400">แก้ไข</Link>
                            <DeleteButton compact action={deleteNovel.bind(null, novel.id)} message={`ลบนิยาย “${novel.title}” และทุกตอนอย่างถาวรหรือไม่?`} />
                        </div>
                    </article>
                ))}

                {!novels?.length && (
                    <div className="rounded-3xl border border-dashed border-slate-300 bg-white/60 px-6 py-16 text-center dark:border-slate-700 dark:bg-slate-900/50">
                        <div className="mx-auto mb-4 grid size-14 place-items-center rounded-2xl bg-indigo-100 text-2xl text-indigo-600 dark:bg-indigo-400/10 dark:text-indigo-300">✦</div>
                        <h3 className="text-lg font-black">เริ่มต้นเรื่องแรกของคุณ</h3>
                        <p className="mt-2 text-slate-500 dark:text-slate-400">สร้างฉบับร่างไว้ก่อน แล้วค่อยเผยแพร่เมื่อพร้อม</p>
                    </div>
                )}
            </div>
        </AuthorShell>
    )
}
