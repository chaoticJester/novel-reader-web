// ไม่มี "use client": เป็น Server Component
// ส่วนที่ต้องมี state (ค้นหา, dropdown) แยกไปเป็น client component ย่อย
import Link from "next/link";
import { Suspense } from "react";
import SearchBar from "@/components/SearchBar";
import UserMenu from "@/components/UserMenu";
import AdminNavLink from "@/components/AdminNavLink";

export type NavigationItem = {
  href: string;
  label: string;
};

const navLinkClass =
  "whitespace-nowrap rounded-lg px-4 py-2 font-medium text-white hover:bg-gray-600";

// ขนาดเท่าปุ่มจริง กันหน้ากระตุก (layout shift) ตอนปุ่มจริงโหลดมาแทนที่
function UserMenuSkeleton() {
  return <div className="h-10 w-32 animate-pulse rounded-lg bg-gray-900" />;
}

export default function Navbar({ items }: { items: NavigationItem[] }) {
  return (
    <nav className="flex shrink-0 py-3 justify-between bg-black px-10 border-gray-500 border-b">
      <div className="flex items-center">
        <p className="font-bold text-2xl">Rat Novel</p>
        <div className="px-8">
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
      <div className="flex items-center gap-5">
        <SearchBar />
        <Suspense fallback={<UserMenuSkeleton />}>
          <UserMenu />
        </Suspense>
      </div>
    </nav>
  );
}