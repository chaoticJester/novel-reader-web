export default function StatusBadge({ status }: { status: 'draft' | 'published' }) {
    const isDraft = status === 'draft'

    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${
            isDraft
                ? 'bg-amber-100 text-amber-800 dark:bg-amber-400/10 dark:text-amber-300'
                : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-400/10 dark:text-emerald-300'
        }`}>
            <span className={`size-1.5 rounded-full ${isDraft ? 'bg-amber-500' : 'bg-emerald-500'}`} />
            {isDraft ? 'ฉบับร่าง' : 'เผยแพร่แล้ว'}
        </span>
    )
}
