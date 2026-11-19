'use client'

import { useEffect } from 'react'
import { syncChapterReads } from '@/lib/chapter-reads-actions'
import {
    getAllReadChapterIds,
    getPendingReads,
    removePendingReads,
    replaceAllReadChapters,
} from '@/lib/read-chapters'

// ส่งคิวรอส่งขึ้น DB แล้วเอา DB มาแทนที่ localStorage (DB = ตัวจริง) ครั้งเดียวต่อแท็บ
export default function ReadingSync({ userId }: { userId: string }) {
    useEffect(() => {
        const flag = `chapter-reads-synced:${userId}`

        try {
            if (sessionStorage.getItem(flag)) return
            sessionStorage.setItem(flag, '1')
        } catch {}

        const clearFlag = () => {
            try {
                sessionStorage.removeItem(flag)
            } catch {}
        }

        // ยังไม่เคยมีคิว (เครื่องเก่า) → ส่งทุกตอนในเครื่องครั้งแรกครั้งเดียว
        const toSend = getPendingReads() ?? getAllReadChapterIds()

        syncChapterReads(toSend)
            .then((reads) => {
                if (!reads) {
                    clearFlag()
                    return
                }
                replaceAllReadChapters(reads)
                removePendingReads(toSend) // สร้างคิว (ว่าง) ให้เครื่องเก่าด้วย
            })
            .catch(clearFlag)
    }, [userId])

    return null
}