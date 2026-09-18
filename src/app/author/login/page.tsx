import { redirect } from 'next/navigation'
import Link from 'next/link'
import LoginForm from './LoginForm'
import { hasAuthorSession } from '@/lib/author-session'
import ThemeToggle from '@/components/ThemeToggle'

export const instant = false

export default async function AuthorLoginPage() {
    if (await hasAuthorSession()) {
        redirect('/author')
    }

    return (
        <main className="relative grid min-h-screen place-items-center overflow-hidden bg-slate-950 px-5 py-12 text-white">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(79,70,229,0.35),transparent_34%),radial-gradient(circle_at_82%_75%,rgba(14,165,233,0.18),transparent_30%)]" />
            <div className="absolute right-5 top-5"><ThemeToggle /></div>

            <div className="relative w-full max-w-md">
                <Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-slate-400 transition hover:text-white">← กลับหน้าอ่านนิยาย</Link>

                <div className="mb-7">
                    <div className="mb-6 grid size-14 place-items-center rounded-2xl bg-indigo-500 shadow-xl shadow-indigo-500/25">
                        <svg viewBox="0 0 24 24" className="size-7" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                            <path d="M5 4.75A2.75 2.75 0 0 1 7.75 2H20v17H7.75A2.75 2.75 0 0 0 5 21.75V4.75Z" />
                            <path d="M5 19a2.75 2.75 0 0 1 2.75-2.75H20M9 6h7" />
                        </svg>
                    </div>
                    <p className="mb-3 text-xs font-bold tracking-[0.2em] text-indigo-300">RAT NOVEL · WRITER STUDIO</p>
                    <h1 className="text-4xl font-black tracking-tight">กลับมาเขียนต่อกัน</h1>
                    <p className="mt-3 leading-7 text-slate-400">กรอกรหัสผู้เขียนเพื่อเข้าสู่พื้นที่จัดการนิยายและต้นฉบับ</p>
                </div>

                <LoginForm />
            </div>
        </main>
    )
}
