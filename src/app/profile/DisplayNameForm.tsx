'use client'

import { useActionState } from 'react'
import { updateDisplayName, type DisplayNameState } from "./actions"
import { MAX_DISPLAY_NAME_LENGTH } from '@/lib/display-name'

const initialState: DisplayNameState = {}

export default function DisplayNameForm({ currentName }: { currentName: string }) {
    const [state, action, pending] = useActionState(updateDisplayName, initialState)

    return (
        <form action={action} className="space-y-3">
            <label htmlFor="displayName" className="block text-sm font-bold text-slate-200">
                ชื่อที่แสดง
            </label>
            <div className="flex gap-3">
                <input
                    id="displayName"
                    name="displayName"
                    type="text"
                    required
                    maxLength={MAX_DISPLAY_NAME_LENGTH}
                    autoComplete="nickname"
                    defaultValue={state.values?.displayName ?? currentName}
                    className="w-full rounded-xl border border-white/15 bg-slate-950/40 px-4 py-3 text-white outline-none transition focus:border-white"
                />
                <button
                    type="submit"
                    disabled={pending}
                    className="shrink-0 rounded-xl bg-white px-5 py-3 font-bold text-black transition hover:bg-black hover:text-white disabled:opacity-50"
                >
                    {pending ? 'กำลังบันทึก...' : 'บันทึก'}
                </button>
            </div>

            {state.error && <p role="alert" className="text-sm text-red-500">{state.error}</p>}
            {state.success && <p role="status" className="text-sm text-green-400">บันทึกแล้ว</p>}
        </form>
    )
}