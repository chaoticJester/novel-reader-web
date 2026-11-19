"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { logout } from "@/app/login/actions";
import { USER_MENU_LINKS } from "@/lib/user-menu-links";
import Avatar from "@/components/Avatar";

export default function UserMenuDropdown({
  displayName,
  avatarUrl,
}: {
  displayName: string;
  avatarUrl: string | null;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const links = USER_MENU_LINKS;

  // ปิดเมื่อคลิกนอกเมนู หรือกด Escape (ฟังเฉพาะตอนเปิดอยู่)
  useEffect(() => {
    if (!open) return;

    function handleClick(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        className="flex items-center gap-2 whitespace-nowrap rounded-lg bg-gray-900 py-1.5 pl-1.5 pr-3 font-medium text-white hover:bg-gray-600"
      >
        <Avatar name={displayName} url={avatarUrl} size="sm" />
        <span className="max-w-40 truncate">{displayName}</span>
        <svg
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
          className={`size-4 transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.17l3.71-3.94a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {open && (
        <div
          id={menuId}
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 w-48 overflow-hidden rounded-lg border border-gray-700 bg-gray-900 py-1 shadow-lg"
        >
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="block px-4 py-2 text-sm text-white hover:bg-gray-700"
            >
              {link.label}
            </Link>
          ))}

          <div className="my-1 border-t border-gray-700" />

          {/* Server Action ใช้กับฟอร์มใน Client Component ได้ */}
          <form action={logout}>
            <button
              type="submit"
              role="menuitem"
              className="block w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-gray-700"
            >
              ออกจากระบบ
            </button>
          </form>
        </div>
      )}
    </div>
  );
}