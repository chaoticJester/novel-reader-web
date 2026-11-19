import Link from "next/link";
import { getCurrentUser } from "@/lib/current-user";

export default async function AdminNavLink({ className }: { className: string }) {
  const user = await getCurrentUser();

  if (user?.role !== "admin") {
    return null;
  }

  return (
    <Link href="/author" className={className}>
      จัดการนิยาย
    </Link>
  );
}