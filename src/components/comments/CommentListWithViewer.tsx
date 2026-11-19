import CommentList from '@/components/comments/CommentList'
import { getCurrentUser } from '@/lib/current-user'
import type { CommentThread } from '@/lib/comments'

// อ่าน session แล้วส่งให้ CommentList รู้ว่าใครกำลังดู (ต้องอยู่ใน Suspense)
export default async function CommentListWithViewer({ threads }: { threads: CommentThread[] }) {
    const user = await getCurrentUser()
    const viewer = user ? { id: user.id, role: user.role } : null // ส่งเท่าที่ต้องใช้

    return <CommentList threads={threads} viewer={viewer} />
}
