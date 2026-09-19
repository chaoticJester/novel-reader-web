import { supabase } from '@/lib/supabase'
import {
    Sarabun,
    Noto_Sans_Thai,
    Noto_Serif_Thai,
    IBM_Plex_Sans_Thai,
    Bai_Jamjuree,
    Chakra_Petch,
} from 'next/font/google'
import ContentReader from '@/components/ContentReader'
import { ReaderSettingsProvider } from '@/components/ReaderSettingsProvider'
import ReaderNavigation from '@/components/ReaderNavigation'
import { cacheTag, cacheLife } from 'next/cache'

// ฟอนต์ทั้งหมดต้องถูกเรียกที่ระดับ module (ข้อกำหนดของ next/font) แล้วส่ง className ลงไป
const sarabun = Sarabun({ subsets: ['thai'], weight: ['400', '700'], display: 'swap' })
const notoSansThai = Noto_Sans_Thai({ subsets: ['thai'], weight: ['400', '700'], display: 'swap' })
const notoSerifThai = Noto_Serif_Thai({ subsets: ['thai'], weight: ['400', '700'], display: 'swap' })
const ibmPlexSansThai = IBM_Plex_Sans_Thai({ subsets: ['thai'], weight: ['400', '700'], display: 'swap' })
const baiJamjuree = Bai_Jamjuree({ subsets: ['thai'], weight: ['400', '700'], display: 'swap' })
const chakraPetch = Chakra_Petch({ subsets: ['thai'], weight: ['400', '700'], display: 'swap' })

// key ต้องตรงกับที่เก็บใน localStorage; ค่าเริ่มต้นคือ 'noto-serif'
const FONTS = [
    { key: 'sarabun', label: 'Sarabun', className: sarabun.className },
    { key: 'noto-sans', label: 'Noto Sans Thai', className: notoSansThai.className },
    { key: 'noto-serif', label: 'Noto Serif Thai', className: notoSerifThai.className },
    { key: 'ibm-plex', label: 'IBM Plex Sans Thai', className: ibmPlexSansThai.className },
    { key: 'bai-jamjuree', label: 'Bai Jamjuree', className: baiJamjuree.className },
    { key: 'chakra-petch', label: 'Chakra Petch', className: chakraPetch.className },
]


export async function generateStaticParams() {
    const { data: chapters } = await supabase
        .from('chapters')
        .select('id, novel_id')
        .eq('publication_status', 'published')
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
            .select(`*, novels!inner(title, publication_status)`)
            .eq('id', chapterId)
            .eq('publication_status', 'published')
            .eq('novels.publication_status', 'published')
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
        // fallback กันเหนียว: ถ้า webhook พลาด nav จะ revalidate เองทุก 1 นาที
        cacheLife({ stale: 30, revalidate: 60, expire: 86400 })

        const [prevRes, nextRes, allChaptersRes] = await Promise.all([
            supabase.from('chapters').select('id').eq('novel_id', novelId).eq('publication_status', 'published').lt('chapter_number', chapterNumber).order('chapter_number', { ascending: false }).limit(1),
            supabase.from('chapters').select('id').eq('novel_id', novelId).eq('publication_status', 'published').gt('chapter_number', chapterNumber).order('chapter_number', { ascending: true }).limit(1),
            supabase.from('chapters').select('id, title, chapter_number, created_at').eq('novel_id', novelId).eq('publication_status', 'published').order('chapter_number', { ascending: true }),
        ])
        return { prevRes, nextRes, allChaptersRes }
    }    

    const { prevRes, nextRes, allChaptersRes } = await getChapterNav(id, chapter.chapter_number)
    const prevChapter = prevRes.data?.[0]
    const nextChapter = nextRes.data?.[0]
    const allChapters = allChaptersRes.data || []

    return (
        <ReaderSettingsProvider>
            <ReaderNavigation
                novelId={id}
                chapterId={chapterId}
                chapterNumber={chapter.chapter_number}
                chapterTitle={chapter.title}
                novelTitle={(Array.isArray(chapter.novels) ? chapter.novels[0]?.title : chapter.novels?.title) ?? ''}
                previousChapter={prevChapter ?? null}
                nextChapter={nextChapter ?? null}
                chapters={allChapters}
                fonts={FONTS}
            >
                <main className="min-h-screen transition-colors">
                    <div className="mb-10 border-b border-slate-200 pb-6 text-center dark:border-slate-700">
                        <h1 className="mb-4 text-2xl font-bold text-slate-900 dark:text-slate-100 md:text-3xl">
                            ตอนที่ {chapter.chapter_number}: {chapter.title}
                        </h1>
                        <p className="text-sm text-gray-400 dark:text-slate-500">
                            อัปเดตเมื่อ: {new Date(chapter.created_at).toLocaleDateString('th-TH')}
                        </p>
                    </div>

                    <ContentReader content={chapter.content} fonts={FONTS} />
                </main>
            </ReaderNavigation>
        </ReaderSettingsProvider>
    )

}
