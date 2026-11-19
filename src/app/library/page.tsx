import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import Navbar, { type NavigationItem } from "@/components/Navbar";
import LibraryToggle from "@/components/LibraryToggle";
import { getCurrentUser } from "@/lib/current-user";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import ProgressStepper from "@/components/ProgressStepper";
import RelativeTime from "@/components/RelativeTime";

export const metadata: Metadata = { title: "ชั้นหนังสือ · Rat Novel" };

const menuItems: NavigationItem[] = [{ href: "/", label: "หน้าหลัก" }];

type LibraryEntry = {
  novel_id: string;
  title: string;
  author_name: string | null;
  cover_image_url: string | null;
  furthest_chapter_number: number | null;
  last_read_at: string | null;
  added_at: string;
  read_count: number;
  total_chapters: number;
  next_chapter_id: string | null;
  next_chapter_number: number | null;
  prev_chapter_number: number | null;
  latest_chapter_at: string | null;
};

function ContinueButton({ entry }: { entry: LibraryEntry }) {
  // เต็มความกว้างการ์ด: มือถือกดง่ายด้วยนิ้วโป้ง
  const base =
    "block w-full rounded-lg px-3 py-2 text-center text-sm transition";

  if (entry.next_chapter_id) {
    const label = entry.furthest_chapter_number === null ? "เริ่มอ่าน" : "อ่านต่อ";
    return (
      <Link
        href={`/novel/${entry.novel_id}/chapter/${entry.next_chapter_id}`}
        className={`${base} bg-white font-bold text-black hover:bg-gray-300`}
      >
        {label} ตอนที่ {entry.next_chapter_number}
      </Link>
    );
  }

  // ไม่มีตอนถัดไป: อ่านทันแล้ว หรือนิยายยังไม่มีตอนเลย
  return (
    <Link
      href={`/novel/${entry.novel_id}`}
      className={`${base} border border-gray-700 text-gray-300 hover:bg-gray-800`}
    >
      {entry.total_chapters === 0 ? "ยังไม่มีตอน · ดูหน้าเรื่อง" : "อ่านทันแล้ว · ดูสารบัญ"}
    </Link>
  );
}

function LibraryCard({ entry }: { entry: LibraryEntry }) {
  return (
    // flex-col + ปุ่ม mt-auto: การ์ดในแถวเดียวกันสูงไม่เท่ากัน ปุ่มก็ยังอยู่ระดับเดียวกัน
    <article className="flex flex-col gap-3 rounded-xl border border-gray-800 bg-gray-900 p-3">
      <div className="flex gap-3">
        <Link
          href={`/novel/${entry.novel_id}`}
          className="h-24 w-16 shrink-0 overflow-hidden rounded-md bg-gray-700"
        >
          {entry.cover_image_url && (
            <img
              src={entry.cover_image_url}
              alt={entry.title}
              className="h-full w-full object-cover"
            />
          )}
        </Link>

        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex items-start gap-1">
            <Link
              href={`/novel/${entry.novel_id}`}
              className="line-clamp-2 flex-1 font-bold leading-snug hover:underline sm:line-clamp-1"
            >
              {entry.title}
            </Link>
            <LibraryToggle
              novelId={entry.novel_id}
              initialInLibrary
              compact
              className="-mr-1 -mt-1 shrink-0"
            />
          </div>

          <p className="line-clamp-1 text-xs text-gray-400">
            {entry.author_name || "ไม่ระบุผู้แต่ง"}
          </p>
          <p className="line-clamp-1 text-xs tabular-nums text-gray-500">
            อ่านแล้ว {entry.read_count}/{entry.total_chapters} ตอน
            {entry.latest_chapter_at && (
              <>
                {" · "}อัปเดต <RelativeTime iso={entry.latest_chapter_at} />
              </>
            )}
          </p>

          <div className="mt-auto pt-1">
            {/* key: บันทึกแล้วค่าเปลี่ยน → mount ใหม่ ช่องกรอกจะรีเซ็ตเป็นค่าล่าสุดเอง */}
            <ProgressStepper
              key={entry.furthest_chapter_number ?? "none"}
              novelId={entry.novel_id}
              currentNumber={entry.furthest_chapter_number}
              prevNumber={entry.prev_chapter_number}
              nextNumber={entry.next_chapter_number}
            />
          </div>
        </div>
      </div>

      <div className="mt-auto">
        <ContinueButton entry={entry} />
      </div>
    </article>
  );
}

// ข้อมูลส่วนตัว: อยู่ใน Suspense และห้ามใส่ 'use cache'
async function LibraryContent() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?next=/library");
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("library_entries")
    .select(
      "novel_id, title, author_name, cover_image_url, furthest_chapter_number, last_read_at, added_at, read_count, total_chapters, next_chapter_id, next_chapter_number, prev_chapter_number, latest_chapter_at",
    )
    .order("latest_chapter_at", { ascending: false, nullsFirst: false })
    .order("added_at", { ascending: false });

  if (error) {
    console.error("Library fetch failed:", error);
    return <p className="text-red-500">โหลดชั้นหนังสือไม่สำเร็จ กรุณาลองใหม่</p>;
  }

  const entries = (data ?? []) as LibraryEntry[];

  if (entries.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-700 px-6 py-16 text-center">
        <p className="text-lg font-bold">ชั้นหนังสือยังว่างอยู่</p>
        <p className="mt-2 text-gray-400">
          กด “เพิ่มเข้าชั้นหนังสือ” ที่หน้านิยายเรื่องที่ชอบ แล้วเรื่องนั้นจะมาอยู่ที่นี่
        </p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-lg bg-white px-5 py-2.5 font-bold text-black hover:bg-gray-300"
        >
          หานิยายอ่าน
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
      {entries.map((entry) => (
        <LibraryCard key={entry.novel_id} entry={entry} />
      ))}
    </div>
  );
}

function LibrarySkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="h-40 animate-pulse rounded-xl bg-gray-900" />
      ))}
    </div>
  );
}

export default function LibraryPage() {
  return (
    <>
      <Navbar items={menuItems} />
      <main className="container mx-auto w-full flex-1 px-4 py-6 text-white sm:px-5 sm:py-10">
        <h1 className="mb-5 text-2xl font-black tracking-tight sm:mb-8 sm:text-3xl">ชั้นหนังสือ</h1>
        <Suspense fallback={<LibrarySkeleton />}>
          <LibraryContent />
        </Suspense>
      </main>
    </>
  );
}
