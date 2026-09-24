import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { cacheTag, cacheLife } from 'next/cache'
import ThemeToggle from '@/components/ThemeToggle'
import RelativeTime from '@/components/RelativeTime'
import RecentChapters from '@/components/RecentChapters'

async function getNovels() {
    'use cache'
    cacheTag('novels-list')
    cacheLife('max')

    // ดึงนิยายทั้งหมด + ตอนล่าสุดของแต่ละเรื่อง แล้วเรียงตาม "เวลาที่มีตอนใหม่ล่าสุด"
    const [novelsRes, chaptersRes] = await Promise.all([
        supabase.from('novels').select('*').eq('publication_status', 'published'),
        // เรียงตอนจากใหม่ไปเก่า เพื่อให้ตอนแรกที่เจอของแต่ละเรื่องคือตอนล่าสุด
        supabase
            .from('chapters')
            .select('id, novel_id, title, chapter_number, created_at')
            .eq('publication_status', 'published')
            .order('created_at', { ascending: false }),
    ])

    const error = novelsRes.error ?? chaptersRes.error

    // สร้าง map: novel_id -> 5 ตอนล่าสุด (เรียง desc มาแล้ว จึงเก็บ 5 ตัวแรกที่เจอ)
    type Chapter = { id: string; title: string; chapter_number: number; created_at: string }
    const chaptersByNovel = new Map<string, Chapter[]>()
    for (const ch of chaptersRes.data ?? []) {
        const list = chaptersByNovel.get(ch.novel_id) ?? []
        if (list.length < 5) {
            list.push(ch)
            chaptersByNovel.set(ch.novel_id, list)
        }
    }

    const novels = (novelsRes.data ?? [])
        .map((novel) => {
            const latestChapters = chaptersByNovel.get(novel.id) ?? []
            return {
                ...novel,
                latest_chapters: latestChapters,
                // ใช้เวลาของตอนล่าสุดเป็นตัวจัดเรียง ถ้ายังไม่มีตอนก็ใช้เวลาสร้างนิยาย
                updated_at: latestChapters[0]?.created_at ?? novel.created_at,
            }
        })
        .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())

    return { data: novels, error }
}

export default async function Home() {
    // ดึงข้อมูลนิยาย เรียงตามตอนที่อัปเดตล่าสุด
    const { data: novels, error } = await getNovels()

    if (error) {
        console.error('Error fetching novels:', error)
        return <div className="p-8 text-red-500">เกิดข้อผิดพลาดในการโหลดข้อมูล: {error.message}</div>
    }

    return (
        <main className="container mx-auto p-8">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold">นิยายแปลอัปเดตล่าสุด</h1>
                <ThemeToggle />
            </div>

            {/* รายการนิยาย: ปกด้านซ้าย + 5 ตอนล่าสุดด้านขวา */}
            <div className="flex flex-col gap-6">
                {novels?.map((novel) => (
                    <div
                        key={novel.id}
                        className="flex gap-4 sm:gap-6 p-4 bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm hover:shadow-md dark:shadow-black/20 transition-shadow"
                    >
                        {/* หน้าปก (ซ้าย) */}
                        <Link
                            href={`/novel/${novel.id}`}
                            className="shrink-0 w-24 sm:w-32 group"
                        >
                            <div className="aspect-3/4 bg-slate-200 dark:bg-slate-700 rounded-lg overflow-hidden shadow-sm group-hover:shadow-md transition-shadow">
                                {novel.cover_image_url && (
                                    <img
                                        src={novel.cover_image_url}
                                        alt={novel.title}
                                        className="w-full h-full object-cover"
                                    />
                                )}
                            </div>
                        </Link>

                        {/* ข้อมูล + 5 ตอนล่าสุด (ขวา) */}
                        <div className="flex-1 min-w-0">
                            <Link href={`/novel/${novel.id}`} className="group">
                                <h2 className="font-semibold text-lg line-clamp-1 text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                    {novel.title}
                                </h2>
                            </Link>
                            <p className="text-sm text-gray-500 dark:text-slate-400 mb-3">
                                {novel.author_name || 'ไม่ระบุผู้แต่ง'}
                            </p>
                            {novel.latest_chapters[0] && (
                                <p className="text-xs text-gray-400 dark:text-slate-500 -mt-2 mb-3">
                                    อัปเดตล่าสุด <RelativeTime iso={novel.latest_chapters[0].created_at} />
                                </p>
                            )}
                            {novel.latest_chapters.length > 0 ? (
                                <RecentChapters novelId={novel.id} chapters={novel.latest_chapters} />
                            ) : (
                                <p className="text-sm text-gray-400 dark:text-slate-500">ยังไม่มีตอน</p>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {novels?.length === 0 && (
                <p className="text-gray-500 text-center mt-10">ยังไม่มีข้อมูลนิยายในระบบ</p>
            )}
        </main>
    );
}
