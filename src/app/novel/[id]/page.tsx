import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { cacheTag, cacheLife } from 'next/cache'
import ThemeToggle from '@/components/ThemeToggle'
import RelativeTime from '@/components/RelativeTime'
import ChapterList from '@/components/ChapterList'

async function getNovel(id: string) {
    'use cache'
    cacheTag(`novel-${id}`)
    cacheLife('max')

    return await supabase
        .from('novels')
        .select('*')
        .eq('id', id)
        .single() // .single() คือบอกว่าเอาแค่ Record เดียว (เพราะ ID ไม่ซ้ำกันอยู่แล้ว)
}

async function getNovelChapters(id: string) {
    'use cache'
    cacheTag(`novel-${id}-toc`) // ใช้ tag เดียวกับหน้าอ่านตอน จะได้ purge พร้อมกันตอนมีตอนใหม่/ลบตอน
    // fallback กันเหนียว: ถ้า webhook พลาด สารบัญจะ revalidate เองทุก 1 นาที
    cacheLife({ stale: 30, revalidate: 60, expire: 86400 })

    return await supabase
        .from('chapters')
        .select('id, title, chapter_number, created_at')
        .eq('novel_id', id)
        .order('chapter_number', { ascending: true })
}

export async function generateStaticParams() {
    const { data: novels } = await supabase
        .from('novels')
        .select('id')
        .limit(500)

    return (novels || []).map((n) => ({ id: n.id }))
}

export default async function NovelDetailPage({ params }: { params: Promise<{ id: string }> }) {
    // ดึง ID ของนิยายจาก URL
    const { id } = await params

    // 1. ดึงข้อมูลรายละเอียดนิยายเรื่องนี้
    const { data: novel, error: novelError } = await getNovel(id)

    // 2. ดึงรายชื่อตอนทั้งหมดของนิยายเรื่องนี้ (เรียงจากตอนที่น้อยไปมาก)
    const { data: chapters } = await getNovelChapters(id)

    if (novelError) {
        return <div className="p-8 text-center text-red-500">ไม่พบข้อมูลนิยาย หรือเกิดข้อผิดพลาด</div>
    }

    // เวลาอัปเดตล่าสุด = created_at ที่ใหม่ที่สุดในบรรดาตอนทั้งหมด
    const latestUpdate = chapters?.reduce<string | null>(
        (latest, ch) => (!latest || new Date(ch.created_at) > new Date(latest) ? ch.created_at : latest),
        null,
    )

    return (
        <main className="container mx-auto p-8 max-w-4xl">
            <div className="flex items-center justify-between mb-6">
                <Link href="/" className="text-blue-500 hover:underline dark:text-blue-400 inline-block">
                    &larr; กลับหน้าหลัก
                </Link>
                <ThemeToggle />
            </div>

            {/* ส่วนบน: รูปหน้าปก (ซ้าย) และ ชื่อเรื่อง/ผู้แต่ง (ขวา จัดกึ่งกลาง) */}
            <div className="flex flex-col md:flex-row gap-8 mb-8 items-center md:items-start">
                
                {/* รูปปกนิยาย */}
                <div className="w-full md:w-1/3 lg:w-1/4 aspect-[3/4] bg-slate-200 dark:bg-slate-700 rounded-lg shrink-0">
                    {novel.cover_image_url && (
                        <img 
                            src={novel.cover_image_url} 
                            alt={novel.title} 
                            className="w-full h-full object-cover rounded-lg shadow-md" 
                        />
                    )}
                </div>

                {/* ชื่อเรื่อง และ ผู้แต่ง (จัดกึ่งกลางในแนวตั้งสำหรับจอคอมพิวเตอร์) */}
                <div className="flex-1 flex flex-col justify-center h-full min-h-[250px] text-center md:text-left">
                    <h1 className="text-3xl md:text-4xl font-bold mb-4 text-slate-900 dark:text-slate-100">{novel.title}</h1>
                    <p className="text-gray-500 dark:text-slate-400 text-lg">
                        ผู้แต่ง: <span className="text-gray-500 dark:text-slate-400 font-medium">{novel.author_name || 'ไม่ระบุ'}</span>
                    </p>
                    {latestUpdate && (
                        <p className="text-sm text-gray-400 dark:text-slate-500 mt-2">
                            อัปเดตล่าสุด <RelativeTime iso={latestUpdate} />
                        </p>
                    )}
                </div>

            </div>

            {/* ส่วนล่าง: เรื่องย่อ (แสดงเต็มความกว้าง) */}
            <div className="mb-12">
                <div className="bg-slate-50 dark:bg-slate-800/60 p-6 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">
                    <h3 className="text-black dark:text-slate-100 text-xl font-semibold mb-4 border-b dark:border-slate-700 pb-2">เรื่องย่อ</h3>
                    <p className="text-gray-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                        {novel.description || 'ยังไม่มีเรื่องย่อ'}
                    </p>
                </div>
            </div>

            {/* รายชื่อตอน */}
            {chapters && chapters.length > 0 ? (
                <ChapterList novelId={novel.id} chapters={chapters} />
            ) : (
                <div>
                    <h2 className="text-2xl font-bold mb-4">รายชื่อตอน (0 ตอน)</h2>
                    <p className="text-gray-500 dark:text-slate-400 text-center py-8 border border-dashed dark:border-slate-700 rounded-lg">
                        ยังไม่มีตอนใหม่สำหรับนิยายเรื่องนี้
                    </p>
                </div>
            )}
        </main>
    )
}
