"use client"

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { escapeLike } from "@/lib/escape-like";

type SearchResult = {
  id: string;
  title: string;
  author_name: string | null;
  cover_image_url: string | null;
};

type SearchBarProps = {
  // คลาสของกล่องนอกสุด ใช้กำหนดความกว้างตามตำแหน่งที่วาง (Navbar คอม / แถวค้นหามือถือ)
  className?: string;
  autoFocus?: boolean;
  // เรียกเมื่อผู้ใช้เลือกผลลัพธ์ หรือกด Escape (มือถือใช้ปิดแถวค้นหา)
  onClose?: () => void;
};

export default function SearchBar({ className = "w-full", autoFocus = false, onClose }: SearchBarProps) {
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
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="flex h-10 items-center gap-2 rounded-lg bg-gray-900 px-3 focus-within:ring-2 focus-within:ring-gray-600">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className="shrink-0 text-gray-500"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        {/* text-base (16px) กัน iOS Safari ซูมหน้าเองตอนแตะช่องพิมพ์ */}
        <input
          type="search"
          enterKeyHint="search"
          autoFocus={autoFocus}
          aria-label="ค้นหานิยายด้วยชื่อ"
          className="w-full min-w-0 bg-transparent text-base outline-0 [&::-webkit-search-cancel-button]:hidden"
          placeholder="ค้นหานิยายด้วยชื่อ"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setOpen(false);
              onClose?.();
            }
          }}
        />
      </div>

      {showDropdown && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-[70vh] overflow-y-auto rounded-lg border border-gray-700 bg-gray-900 shadow-lg md:max-h-96">
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
                      onClose?.();
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
