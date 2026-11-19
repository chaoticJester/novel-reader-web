import Link from 'next/link'
import Avatar from '@/components/Avatar'
import CommentForm from '@/components/comments/CommentForm'
import { getCurrentUser } from '@/lib/current-user'
import { postComment } from '@/lib/comment-actions'
import type { CommentTarget } from '@/lib/comments'

export default async function CommentFormSlot({ target }: { target: CommentTarget }) {
    const user = await getCurrentUser()

    if (!user) {
        const here = target.chapterId
            ? `/novel/${target.novelId}/chapter/${target.chapterId}`
            : `/novel/${target.novelId}`

        return (
            <p className="rounded-lg border border-current/15 px-4 py-3 text-sm opacity-80">
                <Link href={`/login?next=${encodeURIComponent(here)}`} className="font-semibold underline">
                    เข้าสู่ระบบ
                </Link>{' '}
                เพื่อแสดงความคิดเห็น
            </p>
        )
    }

    const action = postComment.bind(null, target)

    return (
        <div className="flex gap-3">
            <Avatar name={user.displayName} url={user.avatarUrl} size="md" />
            <CommentForm action={action} />
        </div>
    )
}