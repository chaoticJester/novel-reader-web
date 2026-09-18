import StatusBadge from './StatusBadge'

type Novel = {
    title: string
    author_name: string | null
    description: string | null
    cover_image_url: string | null
    publication_status: 'draft' | 'published'
}

type Props = {
    action: (formData: FormData) => void | Promise<void>
    novel?: Novel
    submitLabel: string
}

const inputClass = 'w-full rounded-xl border border-slate-300 bg-slate-50/50 px-4 py-3.5 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-950/50 dark:focus:border-indigo-400 dark:focus:bg-slate-950'
const labelClass = 'mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200'

export default function NovelForm({ action, novel, submitLabel }: Props) {
    return (
        <form action={action} className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xl shadow-slate-200/40 dark:border-white/10 dark:bg-slate-900/80 dark:shadow-black/20">
            <div className="flex items-center justify-between gap-4 border-b border-slate-200/80 px-5 py-5 sm:px-7 dark:border-white/10">
                <div>
                    <h2 className="font-bold">รายละเอียดนิยาย</h2>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">ข้อมูลที่ผู้อ่านจะเห็นบนหน้าหลัก</p>
                </div>
                {novel && <StatusBadge status={novel.publication_status} />}
            </div>

            <div className="space-y-6 px-5 py-6 sm:px-7">
                <div>
                    <label htmlFor="title" className={labelClass}>ชื่อนิยาย</label>
                    <input id="title" name="title" required defaultValue={novel?.title ?? ''} placeholder="ชื่อนิยายของคุณ" className={inputClass} />
                </div>

                <div>
                    <label htmlFor="author_name" className={labelClass}>ชื่อผู้แต่ง</label>
                    <input id="author_name" name="author_name" defaultValue={novel?.author_name ?? ''} placeholder="ชื่อที่ใช้เผยแพร่" className={inputClass} />
                </div>

                <div>
                    <label htmlFor="cover_image" className={labelClass}>รูปปก</label>
                    {novel?.cover_image_url && (
                        <img src={novel.cover_image_url} alt={`รูปปก ${novel.title}`} className="mb-4 h-52 w-40 rounded-xl border border-slate-200 object-cover shadow-md dark:border-slate-700" />
                    )}
                    <input
                        id="cover_image"
                        name="cover_image"
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="w-full cursor-pointer rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm file:mr-4 file:rounded-lg file:border-0 file:bg-indigo-100 file:px-4 file:py-2 file:font-bold file:text-indigo-700 hover:border-indigo-400 dark:border-slate-700 dark:bg-slate-950/50 dark:file:bg-indigo-400/10 dark:file:text-indigo-300"
                    />
                    <p className="mt-2 text-sm text-slate-500">JPG, PNG หรือ WebP ขนาดไม่เกิน 5 MB{novel?.cover_image_url ? ' · ไม่เลือกไฟล์ใหม่เพื่อใช้รูปเดิม' : ''}</p>
                </div>

                <div>
                    <label htmlFor="description" className={labelClass}>เรื่องย่อ</label>
                    <textarea id="description" name="description" rows={8} defaultValue={novel?.description ?? ''} placeholder="เขียนเรื่องย่อที่ชวนให้ผู้อ่านอยากเริ่มตอนแรก..." className={`${inputClass} resize-y leading-7`} />
                </div>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-200/80 bg-slate-50/70 px-5 py-5 sm:flex-row sm:justify-end sm:px-7 dark:border-white/10 dark:bg-slate-950/40">
                <button type="submit" name="publication_status" value="draft" className="rounded-xl border border-slate-300 bg-white px-5 py-3 font-bold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800">บันทึกฉบับร่าง</button>
                <button type="submit" name="publication_status" value="published" className="rounded-xl bg-indigo-600 px-6 py-3 font-bold text-white shadow-lg shadow-indigo-600/20 transition hover:-translate-y-0.5 hover:bg-indigo-500">{submitLabel}</button>
            </div>
        </form>
    )
}
