import Link from 'next/link'
import { getCurrentUser } from '@/lib/current-user'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import LibraryToggle from '@/components/LibraryToggle'

// Server: เช็กว่าล็อกอินไหม และเรื่องนี้อยู่ในชั้นแล้วหรือยัง (ต้องอยู่ใน Suspense)
export default async function LibraryButton({ novelId, className = '' }: { novelId: string; className?: string }) {
    const user = await getCurrentUser()

    if (!user) {
        return (
            <div className={className}>
                <Link
                    href={`/login?next=${encodeURIComponent(`/novel/${novelId}`)}`}
                    className="inline-flex h-11 w-full items-center justify-center rounded-lg border border-slate-600 px-5 text-sm font-semibold text-slate-200 transition-colors hover:border-blue-500"
                >
                    + เพิ่มเข้าชั้นหนังสือ
                </Link>
            </div>
        )
    }

    const supabase = await createSupabaseServerClient()
    const { data } = await supabase
        .from('library_items')
        .select('novel_id')
        .eq('novel_id', novelId)
        .maybeSingle() // RLS กรองให้เหลือแค่ของเรา จึงได้ 0 หรือ 1 แถว

    return <LibraryToggle novelId={novelId} initialInLibrary={Boolean(data)} className={className} />
}