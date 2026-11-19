import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { cacheTag, cacheLife } from 'next/cache'
import RelativeTime from '@/components/RelativeTime'
import ChapterList from '@/components/ChapterList'
import NovelStatus from '@/components/NovelStatus'
import RubyText from '@/components/RubyText'
import Navbar, { type NavigationItem } from "@/components/Navbar";

const menuItems: NavigationItem[] = [
  { href: "/", label: "หน้าหลัก" },
];

async function getNovel(id: string) {
    'use cache'
    cacheTag(`novel-${id}`)
    cacheLife('max')

    return await supabase
        .from('novels')
        .select('*, tags(id, name, slug)')
        .eq('id', id)
        .eq('publication_status', 'published')
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
        .eq('publication_status', 'published')
        .order('chapter_number', { ascending: true })
}

export async function generateStaticParams() {
    const { data: novels } = await supabase
        .from('novels')
        .select('id')
        .eq('publication_status', 'published')
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

    const firstChapter = chapters?.[0]
    const latestChapter = chapters && chapters.length > 1 ? chapters[chapters.length - 1] : null

    return (
        <>
            <Navbar items={menuItems}></Navbar>
            <main className="container mx-auto max-w-4xl px-4 py-6 sm:px-6 md:p-8">

                {/* ส่วนบน — มือถือ: ปกเล็กกลางจอ + ข้อมูลจัดกลาง · คอม: ปกซ้าย ข้อมูลขวา */}
                <div className="mb-6 flex flex-col items-center gap-5 md:mb-8 md:flex-row md:items-start md:gap-8">

                    {/* รูปปกนิยาย */}
                    <div className="aspect-[3/4] w-40 shrink-0 rounded-lg bg-slate-200 shadow-md sm:w-48 md:w-1/3 lg:w-1/4 dark:bg-slate-700">
                        {novel.cover_image_url && (
                            <img
                                src={novel.cover_image_url}
                                alt={novel.title}
                                className="h-full w-full rounded-lg object-cover"
                            />
                        )}
                    </div>

                    {/* ชื่อเรื่อง ผู้แต่ง จำนวนตอน เวลาอัปเดต */}
                    <div className="flex w-full flex-1 flex-col justify-center text-center md:min-h-[250px] md:text-left">
                        <h1 className="mb-2 text-2xl font-bold leading-snug text-slate-900 sm:text-3xl md:mb-4 md:text-4xl dark:text-slate-100">{novel.title}</h1>
                        <p className="text-base text-gray-500 md:text-lg dark:text-slate-400">
                            ผู้แต่ง: <span className="font-medium text-gray-500 dark:text-slate-400">{novel.author_name || 'ไม่ระบุ'}</span>
                        </p>
                        <p className="mt-1 text-sm text-gray-500 md:mt-2 md:text-base dark:text-slate-400">
                            จำนวนตอน: {chapters ? chapters.length : "error"}
                            {latestUpdate && (
                                <span className="text-gray-400 dark:text-slate-500">
                                    {' '}· อัปเดตล่าสุด <RelativeTime iso={latestUpdate} />
                                </span>
                            )}
                        </p>
                        <div className="mt-3 flex flex-wrap justify-center gap-2 md:justify-start">
                            <NovelStatus novelStatus={novel.status} />
                            {novel.tags?.map((t: { id: number; name: string; slug: string }) => (
                                <span key={t.id} className="rounded-full px-3 py-1 text-sm border border-slate-400 bg-slate-100 text-slate-600 dark:border-slate-500 dark:bg-slate-800 dark:text-slate-300">
                                    {t.name}
                                </span>
                            ))}
                        </div>

                        {/* ปุ่มเริ่มอ่าน — มือถือเต็มความกว้าง กดง่ายด้วยนิ้วโป้ง · คอมเป็นปุ่มขนาดปกติ */}
                        {firstChapter && (
                            <div className="mt-5 grid grid-cols-2 gap-2 sm:flex sm:justify-center md:justify-start">
                                <Link
                                    href={`/novel/${novel.id}/chapter/${firstChapter.id}`}
                                    className={`inline-flex h-11 items-center justify-center rounded-lg bg-blue-500 px-5 text-sm font-semibold text-white transition-colors hover:bg-blue-600 ${latestChapter ? '' : 'col-span-2'}`}
                                >
                                    อ่านตอนแรก
                                </Link>
                                {latestChapter && (
                                    <Link
                                        href={`/novel/${novel.id}/chapter/${latestChapter.id}`}
                                        className="inline-flex h-11 items-center justify-center rounded-lg border border-slate-300 px-5 text-sm font-semibold text-slate-700 transition-colors hover:border-blue-500 dark:border-slate-600 dark:text-slate-200 dark:hover:border-blue-500"
                                    >
                                        ตอนล่าสุด
                                    </Link>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* ส่วนล่าง: เรื่องย่อ (แสดงเต็มความกว้าง) */}
                <div className="mb-8 md:mb-12">
                    <div className="bg-slate-50 dark:bg-slate-800/60 p-4 sm:p-6 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">
                        <h3 className="text-black dark:text-slate-100 text-lg sm:text-xl font-semibold mb-3 sm:mb-4 border-b dark:border-slate-700 pb-2">เรื่องย่อ</h3>
                        <p className="ruby-text text-gray-700 dark:text-slate-300 whitespace-pre-wrap leading-loose">
                            {novel.description ? <RubyText text={novel.description} /> : 'ยังไม่มีเรื่องย่อ'}
                        </p>
                    </div>
                </div>

                {/* รายชื่อตอน */}
                {chapters && chapters.length > 0 ? (
                    <ChapterList novelId={novel.id} chapters={chapters} />
                ) : (
                    <div>
                        <h2 className="text-xl sm:text-2xl font-bold mb-4">รายชื่อตอน (0 ตอน)</h2>
                        <p className="text-gray-500 dark:text-slate-400 text-center py-8 border border-dashed dark:border-slate-700 rounded-lg">
                            ยังไม่มีตอนใหม่สำหรับนิยายเรื่องนี้
                        </p>
                    </div>
                )}
            </main>
        </>
    )
}
