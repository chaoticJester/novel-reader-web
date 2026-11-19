'use client'

import { useActionState } from 'react'
import { useSearchParams } from 'next/navigation'
import { login, type LoginState } from './actions'

const initialState: LoginState = {}

export default function LoginForm() {
    const [state, action, pending] = useActionState(login, initialState)

    const next = useSearchParams().get('next') ?? '/'

    return (
        <form
            action={action}
            className="space-y-5 rounded-2xl border border-white/10 bg-white/[0.07] p-6 shadow-2xl shadow-black/30 backdrop-blur-xl"
        >
            <input type="hidden" name="next" value={next} />

            <div>
                <label htmlFor="email" className="mb-2 block text-sm font-bold text-slate-200">
                    อีเมล
                </label>
                <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    defaultValue={state.email}
                    placeholder="you@example.com"
                    className="w-full rounded-xl border border-white/15 bg-slate-950/40 px-4 py-3.5 text-white outline-none transition placeholder:text-slate-600 focus:border-white focus:ring-4 focus:ring-indigo-400/10"
                />
            </div>

            <div>
                <label htmlFor="password" className="mb-2 block text-sm font-bold text-slate-200">
                    รหัสผ่าน
                </label>
                <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    autoComplete="current-password"
                    className="w-full rounded-xl border border-white/15 bg-slate-950/40 px-4 py-3.5 text-white outline-none transition placeholder:text-slate-600 focus:border-white focus:ring-4 focus:ring-indigo-400/10"
                />
            </div>

            {state.error && (
                <p role="alert" className="text-sm text-red-500">
                    {state.error}
                </p>
            )}

            <button
                type="submit"
                disabled={pending}
                className="w-full rounded-xl bg-white px-4 py-3.5 font-bold text-black transition hover:-translate-y-0.5 hover:bg-black hover:text-white disabled:translate-y-0 disabled:opacity-50"
            >
                {pending ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
            </button>
        </form>
    )
}