import StatusBadge from './StatusBadge'
import ChapterContentEditor from './ChapterContentEditor'
import type { ChapterImageUploadResult } from '@/app/author/actions'

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
    uploadImageAction: (formData: FormData) => Promise<ChapterImageUploadResult>
}

const inputClass = 'w-full rounded-xl border border-slate-300 bg-slate-50/50 px-4 py-3.5 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-950/50 dark:focus:border-indigo-400 dark:focus:bg-slate-950'
const labelClass = 'mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200'

export default function ChapterForm({ action, chapter, submitLabel, uploadImageAction }: Props) {
    return (
        <form action={action} className="overflow-clip rounded-2xl border border-slate-200/80 bg-white shadow-xl shadow-slate-200/40 dark:border-white/10 dark:bg-slate-900/80 dark:shadow-black/20">
            <div className="flex items-center justify-between gap-4 border-b border-slate-200/80 px-4 py-4 sm:px-7 sm:py-5 dark:border-white/10">
                <div>
                    <h2 className="font-bold">ต้นฉบับตอน</h2>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">รองรับการเขียนเนื้อหาด้วย Markdown</p>
                </div>
                {chapter && <StatusBadge status={chapter.publication_status} />}
            </div>

            <div className="space-y-5 px-4 py-5 sm:space-y-6 sm:px-7 sm:py-6">
                <div className="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-3 sm:grid-cols-[140px_1fr] sm:gap-5">
                    <div>
                        <label htmlFor="chapter_number" className={labelClass}>หมายเลขตอน</label>
                        <input id="chapter_number" name="chapter_number" type="number" min="0" step="0.01" inputMode="decimal" required defaultValue={chapter?.chapter_number ?? ''} className={inputClass} />
                    </div>
                    <div>
                        <label htmlFor="title" className={labelClass}>ชื่อตอน</label>
                        <input id="title" name="title" required defaultValue={chapter?.title ?? ''} placeholder="ชื่อตอน" className={inputClass} />
                    </div>
                </div>

                <ChapterContentEditor
                    defaultValue={chapter?.content ?? ''}
                    uploadImageAction={uploadImageAction}
                    className={`${inputClass} min-h-[24rem] resize-y px-4 py-3 font-mono leading-7 sm:min-h-[32rem] sm:px-5 sm:py-4 sm:leading-8`}
                />
            </div>

            <div className="sticky bottom-0 z-10 grid grid-cols-2 gap-3 border-t border-slate-200/80 bg-slate-50 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:static sm:flex sm:justify-end sm:bg-slate-50/70 sm:px-7 sm:py-5 dark:border-white/10 dark:bg-slate-950 sm:dark:bg-slate-950/40">
                <button type="submit" name="publication_status" value="draft" className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-700 sm:px-5 sm:text-base transition hover:border-slate-400 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800">บันทึกฉบับร่าง</button>
                <button type="submit" name="publication_status" value="published" className="rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white sm:px-6 sm:text-base shadow-lg shadow-indigo-600/20 transition hover:-translate-y-0.5 hover:bg-indigo-500">{submitLabel}</button>
            </div>
        </form>
    )
}
