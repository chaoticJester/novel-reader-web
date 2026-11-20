'use client'

import { useEffect } from 'react'
import { syncChapterReads } from '@/lib/chapter-reads-actions'
import {
    getAllReadChapterIds,
    getPendingReads,
    removePendingReads,
    replaceAllReadChapters,
} from '@/lib/read-chapters'

// sync ไม่ถี่กว่านี้ (สลับแท็บไปมาเร็ว ๆ จะไม่ยิง request ซ้ำ)
const MIN_INTERVAL_MS = 30_000

// เก็บไว้ระดับ module: component ถูก mount ใหม่ตอนเปลี่ยนหน้า ค่านี้ก็ยังอยู่
let lastSyncAt = 0
let lastSyncUserId: string | null = null
let syncing = false

// ส่งคิวรอส่งขึ้น DB แล้วเอา DB มาแทนที่ localStorage (DB = ตัวจริง)
// ทำตอนเปิดหน้า + ทุกครั้งที่กลับมาที่แท็บ เพื่อให้เห็นตอนที่อ่านจากเครื่องอื่น
export default function ReadingSync({ userId }: { userId: string }) {
    useEffect(() => {
        const sync = () => {
            const recentlySynced =
                lastSyncUserId === userId && Date.now() - lastSyncAt < MIN_INTERVAL_MS
            if (syncing || recentlySynced) return
            syncing = true

            // ยังไม่เคยมีคิว (เครื่องเก่า) → ส่งทุกตอนในเครื่องครั้งแรกครั้งเดียว
            const toSend = getPendingReads() ?? getAllReadChapterIds()

            syncChapterReads(toSend)
                .then((reads) => {
                    if (!reads) return // ล้มเหลว → ไม่อัปเดต lastSyncAt รอบหน้าจะลองใหม่
                    replaceAllReadChapters(reads)
                    removePendingReads(toSend) // สร้างคิว (ว่าง) ให้เครื่องเก่าด้วย
                    lastSyncAt = Date.now()
                    lastSyncUserId = userId // เปลี่ยนบัญชี → sync ใหม่ทันทีไม่ต้องรอ 30 วิ
                })
                .catch(() => {})
                .finally(() => {
                    syncing = false
                })
        }

        const onVisible = () => {
            if (document.visibilityState === 'visible') sync()
        }

        sync()
        document.addEventListener('visibilitychange', onVisible)
        return () => document.removeEventListener('visibilitychange', onVisible)
    }, [userId])

    return null
}
