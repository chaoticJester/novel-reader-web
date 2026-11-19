import Link from "next/link";
import { getCurrentUser } from "@/lib/current-user";
import { USER_MENU_LINKS } from "@/lib/user-menu-links";
import { logout } from "@/app/login/actions";
import LoginLink from "@/components/LoginLink";

// ส่วนบัญชีผู้ใช้ในลิ้นชักเมนูมือถือ (Server Component อ่าน cookie จึงต้องอยู่ใน Suspense)
// บนมือถือไม่ใช้ dropdown ซ้อนในลิ้นชัก แต่แสดงทุกลิงก์ออกมาเลย กดได้ในครั้งเดียว
export default async function MobileUserSection({ linkClassName }: { linkClassName: string }) {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <LoginLink className="block w-full rounded-lg bg-white px-4 py-3 text-center font-bold text-black transition-colors hover:bg-gray-200" />
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="mb-1 flex items-center gap-3 px-3 py-2">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-gray-800 font-bold uppercase text-white">
          {user.displayName.slice(0, 1)}
        </span>
        <div className="min-w-0">
          <p className="truncate font-semibold text-white">{user.displayName}</p>
          <p className="text-xs text-gray-400">{user.role === "admin" ? "ผู้ดูแล" : "ผู้อ่าน"}</p>
        </div>
      </div>

      {USER_MENU_LINKS.map((link) => (
        <Link key={link.href} href={link.href} className={linkClassName}>
          {link.label}
        </Link>
      ))}

      <form action={logout}>
        <button
          type="submit"
          className="block w-full rounded-lg px-3 py-3 text-left font-medium text-red-400 transition-colors hover:bg-gray-800"
        >
          ออกจากระบบ
        </button>
      </form>
    </div>
  );
}
