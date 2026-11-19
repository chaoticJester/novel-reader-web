import Link from 'next/link'

type Props = {
    eyebrow?: string
    title: string
    description?: string
    backHref?: string
    backLabel?: string
    actions?: React.ReactNode
    children: React.ReactNode
    width?: 'wide' | 'editor'
}

export default function AuthorShell({
    title,
    description,
    backHref,
    backLabel = 'ย้อนกลับ',
    actions,
    children,
    width = 'wide',
}: Props) {
    return (
        <main className="relative flex-1 overflow-clip bg-slate-50 text-slate-950 dark:bg-black dark:text-slate-100">
            <div className={`relative mx-auto px-4 py-5 sm:px-8 sm:py-8 ${width === 'editor' ? 'max-w-4xl' : 'max-w-6xl'}`}>

                {backHref && (
                    <Link href={backHref} className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-300">
                        <span aria-hidden="true">←</span> {backLabel}
                    </Link>
                )}

                <header className="mb-6 flex sm:mb-8 flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                    <div className="max-w-2xl">
                        <h1 className="text-2xl font-black leading-tight tracking-tight sm:text-4xl">{title}</h1>
                        {description && <p className="mt-2 text-sm leading-6 sm:mt-3 sm:text-base sm:leading-7 text-slate-600 dark:text-slate-400">{description}</p>}
                    </div>
                    {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
                </header>

                {children}
            </div>
        </main>
    )
}
