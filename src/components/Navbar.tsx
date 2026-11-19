"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

export type NavigationItem = {
  href: string;
  label: string;
};

type SearchResult = {
  id: string;
  title: string;
  author_name: string | null;
  cover_image_url: string | null;
};

// escape ตัวอักษรพิเศษของ LIKE (% และ _) เพื่อให้ค้นหาตามตัวอักษรจริง
function escapeLike(value: string) {
  return value.replace(/[\\%_]/g, (c) => `\\${c}`);
}

function SearchBar() {
  const [query, setQuery] = useState("");
  // เก็บผลลัพธ์คู่กับคำค้นที่ใช้ เพื่อรู้ว่าผลลัพธ์ที่มีอยู่ตรงกับคำค้นปัจจุบันหรือยัง
  const [search, setSearch] = useState<{ q: string; results: SearchResult[] }>({
    q: "",
    results: [],
  });
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const trimmed = query.trim();
  const loading = trimmed !== "" && search.q !== trimmed;
  const results = search.results;

  // ค้นหาแบบ debounce: รอให้หยุดพิมพ์ 300ms ก่อนค่อยยิง query
  useEffect(() => {
    const q = trimmed;
    if (!q) return;

    let cancelled = false;
    const timer = setTimeout(async () => {
      const { data, error } = await supabase
        .from("novels")
        .select("id, title, author_name, cover_image_url")
        .eq("publication_status", "published")
        .ilike("title", `%${escapeLike(q)}%`)
        .order("title")
        .limit(8);

      if (cancelled) return;
      if (error) console.error("Search error:", error);
      setSearch({ q, results: data ?? [] });
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [trimmed]);

  // ปิด dropdown เมื่อคลิกนอกช่องค้นหา
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const showDropdown = open && trimmed !== "";

  return (
    <div ref={containerRef} className="relative">
      <div className="bg-gray-900 rounded-lg p-2 flex items-center h-10 w-lg">
        <input
          type="text"
          className="w-full outline-0 bg-transparent"
          placeholder="ค้นหานิยายด้วยชื่อ"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setOpen(false);
          }}
        />
      </div>

      {showDropdown && (
        <div className="absolute right-0 left-0 top-full mt-2 z-50 max-h-96 overflow-y-auto rounded-lg border border-gray-700 bg-gray-900 shadow-lg">
          {loading ? (
            <p className="px-4 py-3 text-sm text-gray-400">กำลังค้นหา...</p>
          ) : results.length === 0 ? (
            <p className="px-4 py-3 text-sm text-gray-400">ไม่พบนิยายที่ตรงกับ “{query.trim()}”</p>
          ) : (
            <ul>
              {results.map((novel) => (
                <li key={novel.id}>
                  <Link
                    href={`/novel/${novel.id}`}
                    onClick={() => {
                      setOpen(false);
                      setQuery("");
                    }}
                    className="flex items-center gap-3 px-3 py-2 hover:bg-gray-700"
                  >
                    <div className="h-14 w-10 shrink-0 overflow-hidden rounded bg-gray-700">
                      {novel.cover_image_url && (
                        <img
                          src={novel.cover_image_url}
                          alt={novel.title}
                          className="h-full w-full object-cover"
                        />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="line-clamp-1 font-medium text-white">{novel.title}</p>
                      <p className="line-clamp-1 text-xs text-gray-400">
                        {novel.author_name || "ไม่ระบุผู้แต่ง"}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export default function Navbar({ items }: { items: NavigationItem[] }) {
  return (
    <nav className="flex shrink-0 py-3 justify-between bg-black px-10 border-gray-500 border-b">
      <div className="flex items-center">
        <p className="font-bold text-2xl">Rat Novel</p>
        <div className="px-8">
          {items.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={
                  "whitespace-nowrap rounded-lg px-4 py-2 text-12px font-medium text-white hover:bg-gray-600"
              }
            >
              {label}
            </Link>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-5">
        <SearchBar />
        <button className="whitespace-nowrap rounded-lg px-4 py-2 text-12px font-medium text-white bg-gray-900 hover:bg-gray-600">ลงชื่อเข้าใช้</button>
      </div>
    </nav>
  );
}
