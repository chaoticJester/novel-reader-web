'use client'

import { useActionState } from 'react'
import { login, type LoginState } from './actions'

const initialState: LoginState = {}

export default function LoginForm() {
    const [state, action, pending] = useActionState(
        login,
        initialState,
    )

    return (
        <form
            action={action}
            className="space-y-5 rounded-2xl border border-white/10 bg-white/[0.07] p-6 shadow-2xl shadow-black/30 backdrop-blur-xl"
        >
            <div>
                <label
                    htmlFor="code"
                    className="mb-2 block text-sm font-bold text-slate-200"
                >
                    รหัสสำหรับผู้เขียน
                </label>

                <input
                    id="code"
                    name="code"
                    type="password"
                    required
                    autoComplete="current-password"
                    placeholder="กรอกรหัสผู้เขียน"
                    className="w-full rounded-xl border border-white/15 bg-slate-950/40 px-4 py-3.5 text-white outline-none transition placeholder:text-slate-600 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-400/10"
                />
            </div>

            {state.error && (
                <p className="text-sm text-red-500">
                    {state.error}
                </p>
            )}

            <button
                type="submit"
                disabled={pending}
                className="w-full rounded-xl bg-indigo-500 px-4 py-3.5 font-bold text-white shadow-lg shadow-indigo-500/20 transition hover:-translate-y-0.5 hover:bg-indigo-400 disabled:translate-y-0 disabled:opacity-50"
            >
                {pending ? 'กำลังตรวจสอบ...' : 'เข้าสู่หน้าผู้เขียน'}
            </button>
        </form>
    )
}
