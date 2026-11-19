"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function LoginLink() {
  const pathname = usePathname();
  const href = pathname === "/" ? "/login" : `/login?next=${encodeURIComponent(pathname)}`;

  return (
    <Link
      href={href}
      className="whitespace-nowrap rounded-lg bg-gray-900 px-4 py-2 font-medium text-white hover:bg-gray-600"
    >
      ลงชื่อเข้าใช้
    </Link>
  );
}