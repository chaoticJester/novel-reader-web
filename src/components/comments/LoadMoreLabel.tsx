'use client'

import { useLinkStatus } from 'next/link'

// ต้องอยู่ "ข้างใน" <Link> ถึงจะรู้สถานะของลิงก์นั้น
export default function LoadMoreLabel() {
    const { pending } = useLinkStatus()
    return <>{pending ? 'กำลังโหลด...' : 'โหลดความคิดเห็นเพิ่มเติม'}</>
}
