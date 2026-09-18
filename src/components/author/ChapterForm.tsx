import StatusBadge from './StatusBadge'

type Chapter = {
    title: string
    chapter_number: number
    content: string
    publication_status: 'draft' | 'published'
}

type Props = {
    action: (formData: FormData) => void | Promise<void>
    chapter?: Chapter
    submitLabel: string
}

const inputClass = 'w-full rounded-xl border border-slate-300 bg-slate-50/50 px-4 py-3.5 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-950/50 dark:focus:border-indigo-400 dark:focus:bg-slate-950'
const labelClass = 'mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200'

export default function ChapterForm({ action, chapter, submitLabel }: Props) {
    return (
        <form action={action} className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xl shadow-slate-200/40 dark:border-white/10 dark:bg-slate-900/80 dark:shadow-black/20">
            <div className="flex items-center justify-between gap-4 border-b border-slate-200/80 px-5 py-5 sm:px-7 dark:border-white/10">
                <div>
                    <h2 className="font-bold">ต้นฉบับตอน</h2>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">รองรับการเขียนเนื้อหาด้วย Markdown</p>
                </div>
                {chapter && <StatusBadge status={chapter.publication_status} />}
            </div>

            <div className="space-y-6 px-5 py-6 sm:px-7">
                <div className="grid gap-5 sm:grid-cols-[140px_1fr]">
                    <div>
                        <label htmlFor="chapter_number" className={labelClass}>หมายเลขตอน</label>
                        <input id="chapter_number" name="chapter_number" type="number" min="1" step="1" required defaultValue={chapter?.chapter_number ?? ''} className={inputClass} />
                    </div>
                    <div>
                        <label htmlFor="title" className={labelClass}>ชื่อตอน</label>
                        <input id="title" name="title" required defaultValue={chapter?.title ?? ''} placeholder="ชื่อตอน" className={inputClass} />
                    </div>
                </div>

                <div>
                    <label htmlFor="content" className={labelClass}>เนื้อหา</label>
                    <textarea id="content" name="content" rows={30} required defaultValue={chapter?.content ?? ''} placeholder="เริ่มเขียนเนื้อหาตอนนี้..." className={`${inputClass} min-h-[32rem] resize-y px-5 py-4 font-mono leading-8`} />
                </div>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-200/80 bg-slate-50/70 px-5 py-5 sm:flex-row sm:justify-end sm:px-7 dark:border-white/10 dark:bg-slate-950/40">
                <button type="submit" name="publication_status" value="draft" className="rounded-xl border border-slate-300 bg-white px-5 py-3 font-bold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800">บันทึกฉบับร่าง</button>
                <button type="submit" name="publication_status" value="published" className="rounded-xl bg-indigo-600 px-6 py-3 font-bold text-white shadow-lg shadow-indigo-600/20 transition hover:-translate-y-0.5 hover:bg-indigo-500">{submitLabel}</button>
            </div>
        </form>
    )
}
