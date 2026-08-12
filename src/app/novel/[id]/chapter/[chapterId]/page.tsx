import { supabase } from '@/lib/supabase'
import Link from 'next/link'

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

    // 2. ค้นหา "ตอนก่อนหน้า" (.lt คือ less than หาตอนที่ลำดับน้อยกว่าปัจจุบัน)
    const { data: prevChapters } = await supabase
        .from('chapters')
        .select('id')
        .eq('novel_id', id)
        .lt('chapter_number', chapter.chapter_number)
        .order('chapter_number', { ascending: false })
        .limit(1)

    // 3. ค้นหา "ตอนถัดไป" (.gt คือ greater than หาตอนที่ลำดับมากกว่าปัจจุบัน)
    const { data: nextChapters } = await supabase
        .from('chapters')
        .select('id')
        .eq('novel_id', id)
        .gt('chapter_number', chapter.chapter_number)
        .order('chapter_number', { ascending: true })
        .limit(1)

    // ดึงข้อมูลตัวแรกออกมา (ถ้าไม่มีจะเป็น undefined)
    const prevChapter = prevChapters?.[0]
    const nextChapter = nextChapters?.[0]

    return (
        <main className="container mx-auto p-4 md:p-8 max-w-3xl">
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
            <div className="text-white text-lg leading-loose whitespace-pre-wrap min-h-[40vh]">
                {chapter.content}
            </div>

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
                <Link
                    href={`/novel/${id}`}
                    className="text-gray-500 hover:text-blue-500"
                >
                    &equiv; สารบัญ
                </Link>

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