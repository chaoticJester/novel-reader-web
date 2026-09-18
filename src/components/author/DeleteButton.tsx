'use client'

type Props = {
    action: () => void | Promise<void>
    label?: string
    message: string
    compact?: boolean
}

export default function DeleteButton({ action, label = 'ลบ', message, compact = false }: Props) {
    return (
        <form
            action={action}
            onSubmit={(event) => {
                if (!window.confirm(message)) event.preventDefault()
            }}
        >
            <button
                type="submit"
                className={compact
                    ? 'rounded-lg px-3 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-400/10'
                    : 'rounded-xl border border-rose-200 bg-white px-4 py-2.5 text-sm font-bold text-rose-600 transition hover:border-rose-300 hover:bg-rose-50 dark:border-rose-500/20 dark:bg-slate-900 dark:text-rose-400 dark:hover:bg-rose-400/10'}
            >
                {label}
            </button>
        </form>
    )
}
