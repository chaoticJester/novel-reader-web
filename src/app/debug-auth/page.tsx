import { Suspense } from 'react'
import { getCurrentUser } from '@/lib/current-user'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { logout } from '@/app/login/actions'

async function tryBecomeAdmin() {
    'use server'

    const supabase = await createSupabaseServerClient()
    const { data } = await supabase.auth.getClaims()
    const userId = data?.claims?.sub

    if (!userId) {
        console.log('[tryBecomeAdmin] ยังไม่ได้ล็อกอิน')
        return
    }

    const { error } = await supabase
        .from('profiles')
        .update({ role: 'admin' })
        .eq('id', userId)

    console.log(
        '[tryBecomeAdmin]',
        error ? `✅ ถูกปฏิเสธ: ${error.message}` : '❌ ไม่มี error — ช่องโหว่!',
    )
}

async function WhoAmI() {
    const user = await getCurrentUser()

    return (
        <div className="space-y-4">
            <pre className="rounded bg-gray-900 p-4">{JSON.stringify(user, null, 2)}</pre>

            {user && (
                <div className="flex gap-3">
                    <form action={logout}>
                        <button className="rounded bg-gray-700 px-4 py-2 hover:bg-gray-600">
                            ล็อกเอาต์
                        </button>
                    </form>
                    <form action={tryBecomeAdmin}>
                        <button className="rounded bg-red-900 px-4 py-2 hover:bg-red-800">
                            🧪 ลองตั้งตัวเองเป็น admin
                        </button>
                    </form>
                </div>
            )}
        </div>
    )
}

export default function DebugAuthPage() {
    return (
        <main className="p-8">
            <h1 className="mb-4 text-xl font-bold">Debug: ใครล็อกอินอยู่</h1>
            <Suspense fallback={<p>กำลังโหลด...</p>}>
                <WhoAmI />
            </Suspense>
        </main>
    )
}