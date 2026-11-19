'use client'

import { useActionState, useEffect, useState } from 'react'
import Avatar from '@/components/Avatar'
import { AVATAR_ACCEPT, MAX_AVATAR_SIZE } from '@/lib/avatar-rules'
import { removeAvatar, updateAvatar, type AvatarState } from './actions'

export default function AvatarForm({ name, currentUrl }: { name: string; currentUrl: string | null }) {
    const [preview, setPreview] = useState<string | null>(null)
    const [clientError, setClientError] = useState<string | null>(null)

    const [state, action, pending] = useActionState(
        async (previous: AvatarState, formData: FormData) => {
            const result = await updateAvatar(previous, formData)
            if (result.success) setPreview(null)
            return result
        },
        {},
    )

    // คืนหน่วยความจำของ object URL เก่าทุกครั้งที่เปลี่ยน preview
    useEffect(() => {
        return () => {
            if (preview) URL.revokeObjectURL(preview)
        }
    }, [preview])

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        setClientError(null)

        if (!file) {
            setPreview(null)
            return
        }
        if (file.size > MAX_AVATAR_SIZE) {
            setClientError('รูปต้องมีขนาดไม่เกิน 2 MB')
            e.target.value = ''
            setPreview(null)
            return
        }
        setPreview(URL.createObjectURL(file))
    }

    const error = clientError ?? state.error

    return (
        <div className="flex items-center gap-5">
            <Avatar name={name} url={preview ?? currentUrl} size="lg" />

            <div className="space-y-3">
                <form action={action} className="flex flex-wrap items-center gap-3">
                    <input
                        type="file"
                        name="avatar"
                        accept={AVATAR_ACCEPT}
                        required
                        onChange={handleChange}
                        className="text-sm text-slate-400 file:mr-3 file:rounded-lg file:border-0 file:bg-gray-700 file:px-3 file:py-2 file:text-white hover:file:bg-gray-600"
                    />
                    <button
                        type="submit"
                        disabled={pending || !preview}
                        className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-black transition hover:bg-black hover:text-white disabled:opacity-50"
                    >
                        {pending ? 'กำลังอัปโหลด...' : 'บันทึกรูป'}
                    </button>
                </form>

                {currentUrl && !preview && (
                    <form action={removeAvatar}>
                        <button type="submit" className="text-sm text-red-400 hover:text-red-300">
                            ลบรูปโปรไฟล์
                        </button>
                    </form>
                )}

                {error && <p role="alert" className="text-sm text-red-500">{error}</p>}
                {state.success && !preview && <p role="status" className="text-sm text-green-400">บันทึกรูปแล้ว</p>}
                <p className="text-xs text-slate-500">JPG, PNG หรือ WebP ไม่เกิน 2 MB</p>
            </div>
        </div>
    )
}