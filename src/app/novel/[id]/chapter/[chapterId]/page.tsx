import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import {Noto_Serif_Thai} from 'next/font/google'
import ContentReader from '@/components/ContentReader' 
import TableOfContentsShelf from '@/components/TableOfContentsShelf' 
import { cacheTag, cacheLife } from 'next/cache'

const notoSerifThai = Noto_Serif_Thai({ 
  subsets: ['thai'],
  weight: ['400', '500'], 
  display: 'swap',
})


export async function generateStaticParams() {
    const { data: chapters } = await supabase
        .from('chapters')
        .select('id, novel_id')
        .limit(500) // จำกัดจำนวน build ล่วงหน้า ตอนที่เหลือ generate on-demand ตอน dynamicParams=true

    return (chapters || []).map((c) => ({
        id: c.novel_id,
        chapterId: c.id,
    }))
}

export default async function ChapterReadingPage({
    params
}: {
    params: Promise<{ id: string, chapterId: string }>
}) {
    const { id, chapterId } = await params

    // 1. ดึงข้อมูลเนื้อหาตอนปัจจุบัน
    async function getChapter(chapterId: string) {
        'use cache'
        cacheTag(`chapter-${chapterId}`)
        cacheLife('max')

        const { data, error } = await supabase
            .from('chapters')
            .select(`*, novels(title)`)
            .eq('id', chapterId)
            .single()
        return { data, error }
    }
    const { data: chapter, error } = await getChapter(chapterId)

    if (error || !chapter) {
        return <div className="p-8 text-center text-red-500">ไม่พบเนื้อหาตอนนี้ หรือเกิดข้อผิดพลาด</div>
    }

    // 2. ดึงข้อมูล (ก่อนหน้า, ถัดไป, และ **รายชื่อตอนทั้งหมด**)
    async function getChapterNav(novelId: string, chapterNumber: number) {
        'use cache'
        cacheTag(`novel-${novelId}-toc`)
        // fallback กันเหนียว: ถ้า webhook พลาด nav จะ revalidate เองทุก 1 ชม.
        cacheLife({ stale: 300, revalidate: 3600, expire: 86400 })

        const [prevRes, nextRes, allChaptersRes] = await Promise.all([
            supabase.from('chapters').select('id').eq('novel_id', novelId).lt('chapter_number', chapterNumber).order('chapter_number', { ascending: false }).limit(1),
            supabase.from('chapters').select('id').eq('novel_id', novelId).gt('chapter_number', chapterNumber).order('chapter_number', { ascending: true }).limit(1),
            supabase.from('chapters').select('id, title, chapter_number').eq('novel_id', novelId).order('chapter_number', { ascending: true }),
        ])
        return { prevRes, nextRes, allChaptersRes }
    }    

    const { prevRes, nextRes, allChaptersRes } = await getChapterNav(id, chapter.chapter_number)
    const prevChapter = prevRes.data?.[0]
    const nextChapter = nextRes.data?.[0]
    const allChapters = allChaptersRes.data || []

    return (
        <main className="container mx-auto p-4 md:p-8 max-w-3xl min-h-screen transition-colors">
            <div className="mb-8">
                <Link
                    href={`/novel/${id}`}
                    className="text-gray-500 hover:text-blue-500 hover:underline transition-colors"
                >
                    &larr; กลับหน้ารายละเอียด: {chapter.novels?.title}
                </Link>
            </div>

            <div className="mb-10 pb-6 border-b text-center">
                <h1 className="text-2xl md:text-3xl font-bold mb-4">
                    ตอนที่ {chapter.chapter_number}: {chapter.title}
                </h1>
                <p className="text-sm text-gray-400">
                    อัปเดตเมื่อ: {new Date(chapter.created_at).toLocaleDateString('th-TH')}
                </p>
            </div>

            {/* เนื้อหานิยาย */}
            <ContentReader
                content={chapter.content}
                fontClassName={notoSerifThai.className}
            />
            
            {/* ปุ่มนำทาง (Navigation) */}
            <div className="mt-16 pt-8 border-t flex flex-col sm:flex-row justify-between items-center gap-4">

                {/* ปุ่มตอนก่อนหน้า */}
                {prevChapter ? (
                    <Link
                        href={`/novel/${id}/chapter/${prevChapter.id}`}
                        className="w-full sm:w-auto text-center px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors font-medium"
                    >
                        &larr; ตอนก่อนหน้า
                    </Link>
                ) : (
                    <div className="w-full sm:w-[140px]"></div> // กล่องเปล่าเพื่อรักษาระยะห่าง
                )}

                {/* ปุ่มกลับสารบัญ */}
                <TableOfContentsShelf 
                    novelId={id} 
                    chapters={allChapters} 
                    currentChapterId={chapterId} 
                />

                {/* ปุ่มตอนถัดไป */}
                {nextChapter ? (
                    <Link
                        href={`/novel/${id}/chapter/${nextChapter.id}`}
                        className="w-full sm:w-auto text-center px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors font-medium shadow-sm"
                    >
                        ตอนถัดไป &rarr;
                    </Link>
                ) : (
                    <div className="w-full sm:w-[140px]"></div>
                )}

            </div>
        </main>
    )
    
}
