import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import {Noto_Serif_Thai} from 'next/font/google'
import ContentReader from '@/components/ContentReader' 
import TableOfContentsShelf from '@/components/TableOfContentsShelf' 

const notoSerifThai = Noto_Serif_Thai({ 
  subsets: ['thai'],
  weight: ['400', '500'], 
  display: 'swap',
})

export default async function ChapterReadingPage({
    params
}: {
    params: Promise<{ id: string, chapterId: string }>
}) {
    const { id, chapterId } = await params

    // 1. ดึงข้อมูลเนื้อหาตอนปัจจุบัน
    const { data: chapter, error } = await supabase
        .from('chapters')
        .select(`*, novels(title)`)
        .eq('id', chapterId)
        .single()

    if (error || !chapter) {
        return <div className="p-8 text-center text-red-500">ไม่พบเนื้อหาตอนนี้ หรือเกิดข้อผิดพลาด</div>
    }

    // 2. ดึงข้อมูล (ก่อนหน้า, ถัดไป, และ **รายชื่อตอนทั้งหมด**)
    const [prevRes, nextRes, allChaptersRes] = await Promise.all([
        // ก่อนหน้า
        supabase.from('chapters').select('id').eq('novel_id', id).lt('chapter_number', chapter.chapter_number).order('chapter_number', { ascending: false }).limit(1),
        // ถัดไป
        supabase.from('chapters').select('id').eq('novel_id', id).gt('chapter_number', chapter.chapter_number).order('chapter_number', { ascending: true }).limit(1),
        // รายชื่อตอนทั้งหมดของเรื่องนี้ (ดึงแค่ข้อมูลที่จำเป็นเพื่อความรวดเร็ว)
        supabase.from('chapters').select('id, title, chapter_number').eq('novel_id', id).order('chapter_number', { ascending: true })
    ])

    const prevChapter = prevRes.data?.[0]
    const nextChapter = nextRes.data?.[0]
    const allChapters = allChaptersRes.data || [] // เก็บรายชื่อตอนทั้งหมด

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