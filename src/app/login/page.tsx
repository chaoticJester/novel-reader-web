import { Suspense } from "react";
import Link from "next/link";
import LoginForm from "./LoginForm";

export default function LoginPage() {
  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-black px-5 py-12 text-white">
      <div className="relative w-full max-w-md">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-slate-400 transition hover:text-white"
        >
          ← กลับหน้าหลัก
        </Link>

        <div className="mb-7">
          <p className="mb-3 text-xs font-bold tracking-[0.2em] text-white">
            RAT NOVEL
          </p>
          <h1 className="text-4xl font-black tracking-tight">เข้าสู่ระบบ</h1>
          <p className="mt-3 leading-7 text-slate-400">
            เข้าสู่ระบบเพื่อคอมเมนต์ และเก็บประวัติการอ่านไว้ทุกเครื่อง
          </p>
        </div>

        {/* useSearchParams อ่านค่าจาก URL ตอน request จึงต้องอยู่ใน Suspense */}
        <Suspense
          fallback={<div className="h-80 rounded-2xl bg-white/[0.07]" />}
        >
          <LoginForm />
        </Suspense>
        <p className="mt-6 text-center text-sm text-slate-400">
          ยังไม่มีบัญชี?{" "}
          <Link
            href="/signup"
            className="font-semibold text-indigo-300 hover:text-indigo-200"
          >
            สมัครสมาชิก
          </Link>
        </p>
      </div>
    </main>
  );
}
