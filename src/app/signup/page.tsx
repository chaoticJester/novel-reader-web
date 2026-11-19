import Link from 'next/link'
import SignupForm from './SignupForm'

export default function SignupPage() {
    return (
        <main className="relative grid min-h-dvh justify-items-center overflow-hidden bg-black px-4 pb-10 pt-6 text-white sm:place-items-center sm:px-5 sm:py-12">
            <div className="relative w-full max-w-md">
                <Link
                    href="/"
                    className="mb-6 inline-flex items-center gap-2 text-sm sm:mb-8 font-semibold text-slate-400 transition hover:text-white"
                >
                    ← กลับหน้าหลัก
                </Link>

                <div className="mb-7">
                    <p className="mb-3 text-xs font-bold tracking-[0.2em] text-white">RAT NOVEL</p>
                    <h1 className="text-3xl font-black tracking-tight sm:text-4xl">สมัครสมาชิก</h1>
                    <p className="mt-3 leading-7 text-slate-400">
                        สมัครเพื่อคอมเมนต์ และเก็บประวัติการอ่านไว้ทุกเครื่อง
                    </p>
                </div>

                <SignupForm />

                <p className="mt-6 text-center text-sm text-slate-400">
                    มีบัญชีอยู่แล้ว?{' '}
                    <Link href="/login" className="font-semibold text-indigo-300 hover:text-indigo-200">
                        เข้าสู่ระบบ
                    </Link>
                </p>
            </div>
        </main>
    )
}