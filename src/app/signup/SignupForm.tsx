'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { signup, type SignupState } from './actions'

const initialState: SignupState = {}

const inputClass =
    'w-full rounded-xl border border-white/15 bg-slate-950/40 px-4 py-3.5 text-white outline-none transition placeholder:text-slate-600 focus:border-white focus:ring-4 focus:ring-indigo-400/10'
const labelClass = 'mb-2 block text-sm font-bold text-slate-200'

export default function SignupForm() {
    const [state, action, pending] = useActionState(signup, initialState)

    if (state.done) {
        return (
            <div className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.07] p-6 text-center">
                <p className="text-4xl">📬</p>
                <h2 className="text-xl font-bold">เช็กอีเมลของคุณ</h2>
                <p className="leading-7 text-slate-400">
                    เราส่งลิงก์ยืนยันไปที่อีเมลของคุณแล้ว กดลิงก์เพื่อเริ่มใช้งาน
                    (ถ้าไม่เจอ ลองดูในโฟลเดอร์สแปม)
                </p>
                <Link href="/" className="inline-block text-sm font-semibold text-indigo-300 hover:text-indigo-200">
                    กลับหน้าหลัก
                </Link>
            </div>
        )
    }

    return (
        <form
            action={action}
            className="space-y-5 rounded-2xl border border-white/10 bg-white/[0.07] p-6 shadow-2xl shadow-black/30 backdrop-blur-xl"
        >
            <div>
                <label htmlFor="displayName" className={labelClass}>ชื่อที่แสดง</label>
                <input
                    id="displayName"
                    name="displayName"
                    type="text"
                    required
                    maxLength={50}
                    autoComplete="nickname"
                    defaultValue={state.values?.displayName}
                    placeholder="ชื่อที่จะขึ้นข้างคอมเมนต์"
                    className={inputClass}
                />
            </div>

            <div>
                <label htmlFor="email" className={labelClass}>อีเมล</label>
                <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    defaultValue={state.values?.email}
                    placeholder="you@example.com"
                    className={inputClass}
                />
            </div>

            <div>
                <label htmlFor="password" className={labelClass}>รหัสผ่าน</label>
                <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    minLength={8}
                    autoComplete="new-password"
                    placeholder="อย่างน้อย 8 ตัวอักษร"
                    className={inputClass}
                />
            </div>

            <div>
                <label htmlFor="confirmPassword" className={labelClass}>ยืนยันรหัสผ่าน</label>
                <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    minLength={8}
                    autoComplete="new-password"
                    className={inputClass}
                />
            </div>

            {state.error && (
                <p role="alert" className="text-sm text-red-500">{state.error}</p>
            )}

            <button
                type="submit"
                disabled={pending}
                className="w-full rounded-xl bg-white px-4 py-3.5 font-bold text-black transition hover:-translate-y-0.5 hover:bg-black hover:text-white disabled:translate-y-0 disabled:opacity-50"
            >
                {pending ? 'กำลังสมัคร...' : 'สมัครสมาชิก'}
            </button>
        </form>
    )
}