"use client";

import { useEffect, useState, type MouseEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import SearchBar from "@/components/SearchBar";

const iconButtonClass =
  "inline-flex size-10 items-center justify-center rounded-lg text-white transition-colors hover:bg-gray-800";

// ส่วนของ Navbar ที่แสดงเฉพาะบนมือถือ/แท็บเล็ต (ต่ำกว่า md):
// ปุ่มค้นหา (เปิดแถวค้นหาใต้ Navbar) + ปุ่ม ☰ (เปิดลิ้นชักเมนูจากด้านขวา)
// children คือเนื้อหาในลิ้นชัก ซึ่ง Navbar (Server Component) render มาให้
// จึงใส่ของที่ต้องอ่าน cookie บน server ได้ เช่น ลิงก์ admin และข้อมูลผู้ใช้
export default function MobileNav({ children }: { children: ReactNode }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // ลิ้นชักเปิดอยู่: ล็อกการเลื่อนหน้าด้านหลัง และปิดได้ด้วย Escape
  useEffect(() => {
    if (!menuOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("keydown", handleKey);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKey);
    };
  }, [menuOpen]);

  // กดลิงก์หรือปุ่มออกจากระบบในลิ้นชักแล้วปิดลิ้นชักทันที
  const closeOnNavigate = (e: MouseEvent<HTMLDivElement>) => {
    if ((e.target as Element).closest('a, button[type="submit"]')) setMenuOpen(false);
  };

  return (
    <div className="flex items-center gap-1 md:hidden">
      <button
        type="button"
        onClick={() => setSearchOpen((open) => !open)}
        aria-label={searchOpen ? "ปิดช่องค้นหา" : "ค้นหานิยาย"}
        aria-expanded={searchOpen}
        className={`${iconButtonClass} ${searchOpen ? "bg-gray-800" : ""}`}
      >
        {searchOpen ? (
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
        )}
      </button>

      <button
        type="button"
        onClick={() => setMenuOpen(true)}
        aria-label="เปิดเมนู"
        aria-expanded={menuOpen}
        className={iconButtonClass}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 6h16" /><path d="M4 12h16" /><path d="M4 18h16" /></svg>
      </button>

      {/* แถวค้นหา: วางต่อใต้ Navbar เต็มความกว้าง (Navbar เป็น relative) */}
      {searchOpen && (
        <div className="absolute inset-x-0 top-full border-b border-gray-700 bg-black px-4 py-3 animate-slide-down">
          <SearchBar autoFocus onClose={() => setSearchOpen(false)} />
        </div>
      )}

      {/* ลิ้นชักเมนู: portal ไปที่ body ให้ทับทุกอย่าง ไม่ติดกับ stacking ของ Navbar */}
      {menuOpen &&
        createPortal(
          <div className="fixed inset-0 z-50 md:hidden">
            <div
              className="absolute inset-0 bg-black/60 animate-fade-in"
              onClick={() => setMenuOpen(false)}
              aria-hidden="true"
            />
            <div
              role="dialog"
              aria-modal="true"
              aria-label="เมนู"
              className="absolute inset-y-0 right-0 flex w-[82vw] max-w-xs flex-col border-l border-gray-700 bg-black shadow-2xl animate-drawer-in"
            >
              <div className="flex h-16 shrink-0 items-center justify-between border-b border-gray-700 px-4">
                <p className="text-xl font-bold">Rat Novel</p>
                <button
                  type="button"
                  onClick={() => setMenuOpen(false)}
                  aria-label="ปิดเมนู"
                  className={iconButtonClass}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                </button>
              </div>
              <div
                className="flex min-h-0 flex-1 flex-col overflow-y-auto p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
                onClick={closeOnNavigate}
              >
                {children}
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
