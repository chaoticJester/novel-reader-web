import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default async function Home() {
    // ดึงข้อมูลนิยายจากตาราง novels เรียงจากใหม่ไปเก่า
    const { data: novels, error } = await supabase
        .from('novels')
        .select('*')
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching novels:', error)
        return <div className="p-8 text-red-500">เกิดข้อผิดพลาดในการโหลดข้อมูล: {error.message}</div>
    }

    return (
        <main className="container mx-auto p-8">
            <h1 className="text-3xl font-bold mb-8">นิยายอัปเดตล่าสุด</h1>

            {/* ใช้ CSS Grid ของ Tailwind จัดเรียงเป็นการ์ด */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {novels?.map((novel) => (
                    <Link href={`/novel/${novel.id}`} key={novel.id} className="group cursor-pointer">
                        {/* พื้นที่สำหรับใส่หน้าปก (ตอนนี้ใส่สีเทาไว้เป็น Placeholder ก่อน) */}
                        <div className="aspect-3/4 bg-slate-200 rounded-lg mb-3 shadow-sm group-hover:shadow-md transition-shadow">
                            {novel.cover_image_url && (
                                <img
                                    src={novel.cover_image_url}
                                    alt={novel.title}
                                    className="w-full h-full object-cover rounded-lg"
                                />
                            )}
                        </div>

                        <h2 className="font-semibold text-lg line-clamp-1">{novel.title}</h2>
                        <p className="text-sm text-gray-500">{novel.author_name || 'ไม่ระบุผู้แต่ง'}</p>
                    </Link>
                ))}
            </div>

            {novels?.length === 0 && (
                <p className="text-gray-500 text-center mt-10">ยังไม่มีข้อมูลนิยายในระบบ</p>
            )}
        </main>
    );
}
