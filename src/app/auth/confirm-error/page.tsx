import Link from 'next/link'

export default function ConfirmErrorPage() {
    return (
        <main className="grid min-h-screen place-items-center bg-black px-5 text-white">
            <div className="max-w-md space-y-4 text-center">
                <p className="text-4xl">😿</p>
                <h1 className="text-2xl font-bold">ลิงก์ยืนยันใช้ไม่ได้</h1>
                <p className="leading-7 text-slate-400">
                    ลิงก์อาจหมดอายุ หรือถูกใช้ไปแล้ว ลองเข้าสู่ระบบดู ถ้ายังไม่ได้ ให้สมัครใหม่อีกครั้ง
                </p>
                <div className="flex justify-center gap-4 text-sm font-semibold">
                    <Link href="/login" className="text-indigo-300 hover:text-indigo-200">เข้าสู่ระบบ</Link>
                    <Link href="/signup" className="text-indigo-300 hover:text-indigo-200">สมัครใหม่</Link>
                </div>
            </div>
        </main>
    )
}