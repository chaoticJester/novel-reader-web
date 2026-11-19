"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const defaultClassName =
  "whitespace-nowrap rounded-lg bg-gray-900 px-4 py-2 font-medium text-white hover:bg-gray-600";

export default function LoginLink({ className = defaultClassName }: { className?: string }) {
  const pathname = usePathname();
  const href = pathname === "/" ? "/login" : `/login?next=${encodeURIComponent(pathname)}`;

  return (
    <Link href={href} className={className}>
      ลงชื่อเข้าใช้
    </Link>
  );
}
