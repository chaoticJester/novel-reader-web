// ไม่มี "use client": เป็น Server Component
// ส่วนที่ต้องมี state (ค้นหา, dropdown, ลิ้นชักมือถือ) แยกไปเป็น client component ย่อย
//
// คอม (md ขึ้นไป): โลโก้ + เมนู | ช่องค้นหา + เมนูผู้ใช้ (แบบเดิม)
// มือถือ (ต่ำกว่า md): โลโก้ | ปุ่มค้นหา + ปุ่ม ☰ เปิดลิ้นชักเมนู
import Link from "next/link";
import { Suspense } from "react";
import SearchBar from "@/components/SearchBar";
import UserMenu from "@/components/UserMenu";
import AdminNavLink from "@/components/AdminNavLink";
import MobileNav from "@/components/MobileNav";
import MobileUserSection from "@/components/MobileUserSection";

export type NavigationItem = {
  href: string;
  label: string;
};

const navLinkClass =
  "whitespace-nowrap rounded-lg px-3 py-2 font-medium text-white hover:bg-gray-600 lg:px-4";

// ลิงก์ในลิ้นชักมือถือ: ตัวใหญ่ขึ้นและสูงพอให้นิ้วกดง่าย
const mobileLinkClass =
  "block rounded-lg px-3 py-3 font-medium text-white transition-colors hover:bg-gray-800";

// ขนาดเท่าปุ่มจริง กันหน้ากระตุก (layout shift) ตอนปุ่มจริงโหลดมาแทนที่
function UserMenuSkeleton() {
  return <div className="h-10 w-32 animate-pulse rounded-lg bg-gray-900" />;
}

export default function Navbar({ items }: { items: NavigationItem[] }) {
  return (
    <header className="sticky top-0 z-40 shrink-0 border-b border-gray-500 bg-black">
      <nav className="relative flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-10">
        <div className="flex min-w-0 items-center">
          <Link href="/" className="whitespace-nowrap text-xl font-bold md:text-2xl">
            Rat Novel
          </Link>
          <div className="hidden items-center md:flex md:pl-5 lg:pl-8">
            {items.map(({ href, label }) => (
              <Link key={href} href={href} className={navLinkClass}>
                {label}
              </Link>
            ))}
            {/* อ่าน cookie จึงต้องอยู่ใน Suspense; คนทั่วไปไม่เห็นอะไร จึงใช้ fallback เป็น null */}
            <Suspense fallback={null}>
              <AdminNavLink className={navLinkClass} />
            </Suspense>
          </div>
        </div>

        {/* คอม */}
        <div className="hidden min-w-0 flex-1 items-center justify-end gap-3 md:flex lg:gap-5">
          <SearchBar className="w-full max-w-xs lg:max-w-lg" />
          <Suspense fallback={<UserMenuSkeleton />}>
            <UserMenu />
          </Suspense>
        </div>

        {/* มือถือ */}
        <MobileNav>
          <div className="flex flex-col gap-1">
            {items.map(({ href, label }) => (
              <Link key={href} href={href} className={mobileLinkClass}>
                {label}
              </Link>
            ))}
            <Suspense fallback={null}>
              <AdminNavLink className={mobileLinkClass} />
            </Suspense>
          </div>

          <div className="mt-auto border-t border-gray-700 pt-3">
            <Suspense fallback={<div className="h-12 animate-pulse rounded-lg bg-gray-900" />}>
              <MobileUserSection linkClassName={mobileLinkClass} />
            </Suspense>
          </div>
        </MobileNav>
      </nav>
    </header>
  );
}
