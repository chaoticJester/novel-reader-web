import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default async function NovelDetailPage({ params }: { params: { id: string } }) {
    // ดึง ID ของนิยายจาก URL
    const { id } = await params

    // 1. ดึงข้อมูลรายละเอียดนิยายเรื่องนี้
    const { data: novel, error: novelError } = await supabase
        .from('novels')
        .select('*')
        .eq('id', id)
        .single() // .single() คือบอกว่าเอาแค่ Record เดียว (เพราะ ID ไม่ซ้ำกันอยู่แล้ว)

    // 2. ดึงรายชื่อตอนทั้งหมดของนิยายเรื่องนี้ (เรียงจากตอนที่น้อยไปมาก)
    const { data: chapters, error: chaptersError } = await supabase
        .from('chapters')
        .select('id, title, chapter_number, created_at')
        .eq('novel_id', id)
        .order('chapter_number', { ascending: true })

    if (novelError) {
        return <div className="p-8 text-center text-red-500">ไม่พบข้อมูลนิยาย หรือเกิดข้อผิดพลาด</div>
    }

    return (
        <main className="container mx-auto p-8 max-w-4xl">
            <Link href="/" className="text-blue-500 hover:underline mb-6 inline-block">
                &larr; กลับหน้าหลัก
            </Link>

            {/* ส่วนบน: รูปหน้าปก (ซ้าย) และ ชื่อเรื่อง/ผู้แต่ง (ขวา จัดกึ่งกลาง) */}
            <div className="flex flex-col md:flex-row gap-8 mb-8 items-center md:items-start">
                
                {/* รูปปกนิยาย */}
                <div className="w-full md:w-1/3 lg:w-1/4 aspect-[3/4] bg-slate-200 rounded-lg shrink-0">
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
                    <h1 className="text-3xl md:text-4xl font-bold mb-4">{novel.title}</h1>
                    <p className="text-gray-500 text-lg">
                        ผู้แต่ง: <span className="text-gray-700 font-medium">{novel.author_name || 'ไม่ระบุ'}</span>
                    </p>
                </div>

            </div>

            {/* ส่วนล่าง: เรื่องย่อ (แสดงเต็มความกว้าง) */}
            <div className="mb-12">
                <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 shadow-sm">
                    <h3 className="text-black text-xl font-semibold mb-4 border-b pb-2">เรื่องย่อ</h3>
                    <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                        {novel.description || 'ยังไม่มีเรื่องย่อ'}
                    </p>
                </div>
            </div>

            {/* รายชื่อตอน */}
            <div>
                <h2 className="text-2xl font-bold mb-4">รายชื่อตอน ({chapters?.length || 0} ตอน)</h2>
                {chapters && chapters.length > 0 ? (
                    <ul className="space-y-2">
                        {chapters.map((chapter) => (
                            <li key={chapter.id}>
                                {/* เตรียม Link ไปยังหน้าอ่านตอน (เดี๋ยวเราจะทำหน้านี้ทีหลัง) */}
                                <Link
                                    href={`/novel/${novel.id}/chapter/${chapter.id}`}
                                    className="block p-4 bg-white border rounded-lg hover:border-blue-500 hover:shadow-sm transition-all"
                                >
                                    <span className="font-semibold text-black mr-4">ตอนที่ {chapter.chapter_number}</span>
                                    <span className="text-black mr-4">{chapter.title}</span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-gray-500 text-center py-8 border border-dashed rounded-lg">
                        ยังไม่มีตอนใหม่สำหรับนิยายเรื่องนี้
                    </p>
                )}
            </div>
        </main>
    )
}
