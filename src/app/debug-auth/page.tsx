import { Suspense } from 'react'
import { getCurrentUser } from '@/lib/current-user'

// อ่าน cookie จึงเป็น dynamic ต้องอยู่ใน <Suspense>
// (เพราะเปิด cacheComponents ไว้ ไม่อย่างนั้นจะ error ตอน build)
async function WhoAmI() {
    const user = await getCurrentUser()
    return <pre>{JSON.stringify(user, null, 2)}</pre>
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