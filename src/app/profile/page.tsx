import type { Metadata } from 'next'
import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import Navbar, { type NavigationItem } from '@/components/Navbar'
import { getCurrentUser } from '@/lib/current-user'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import DisplayNameForm from './DisplayNameForm'
import AvatarForm from './AvatarForm'

export const metadata: Metadata = { title: 'โปรไฟล์ · Rat Novel' }

const menuItems: NavigationItem[] = [{ href: '/', label: 'หน้าหลัก' }]

const roleLabel = { reader: 'นักอ่าน', admin: 'ผู้ดูแล' } as const

// ข้อมูลส่วนตัว: อ่าน cookie จึงอยู่ใน Suspense และห้ามใส่ 'use cache' เด็ดขาด
async function ProfileContent() {
    const user = await getCurrentUser()
    if (!user) {
        redirect('/login?next=/profile')
    }

    const supabase = await createSupabaseServerClient()
    const [{ data: claimsData }, { data: profile }] = await Promise.all([
        supabase.auth.getClaims(),
        supabase.from('profiles').select('created_at').eq('id', user.id).single(),
    ])

    const email = claimsData?.claims?.email
    const joinedAt = profile
        ? new Date(profile.created_at).toLocaleDateString('th-TH', {
              dateStyle: 'long',
              timeZone: 'Asia/Bangkok',
          })
        : null

    return (
      <div className="space-y-6">
        <section className="rounded-2xl border border-white/10 bg-white/[0.07] p-6">
            <AvatarForm name={user.displayName} currentUrl={user.avatarUrl} />
        </section>
        <section className="rounded-2xl border border-white/10 bg-white/[0.07] p-6">
                <DisplayNameForm currentName={user.displayName} />
                <p className="mt-3 text-xs text-slate-500">ชื่อนี้จะแสดงข้างคอมเมนต์ของคุณ</p>
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/[0.07] p-6">
                <dl className="grid grid-cols-[8rem_1fr] gap-y-3 text-sm">
                    <dt className="text-slate-400">อีเมล</dt>
                    <dd className="break-all">{email ?? '-'}</dd>
                    <dt className="text-slate-400">ประเภทบัญชี</dt>
                    <dd>{roleLabel[user.role]}</dd>
                    <dt className="text-slate-400">สมัครเมื่อ</dt>
                    <dd>{joinedAt ?? '-'}</dd>
                </dl>
            </section>
        </div>
    )
}

function ProfileSkeleton() {
    return (
        <div className="space-y-6">
            <div className="h-36 animate-pulse rounded-2xl bg-white/[0.07]" />
            <div className="h-32 animate-pulse rounded-2xl bg-white/[0.07]" />
        </div>
    )
}

export default function ProfilePage() {
    return (
        <>
            <Navbar items={menuItems} />
            <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-10 text-white">
                <h1 className="mb-8 text-3xl font-black tracking-tight">โปรไฟล์</h1>
                <Suspense fallback={<ProfileSkeleton />}>
                    <ProfileContent />
                </Suspense>
            </main>
        </>
    )
}