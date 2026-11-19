-- ชั้นหนังสือ: นิยายที่ผู้ใช้กดเพิ่มเอง
-- ต้องรันหลัง 20261120_chapter_reads.sql (ใช้ view reading_history)

-- =========================================================
-- 1. ตาราง
-- =========================================================
create table if not exists public.library_items (
    user_id uuid not null
        references public.profiles(id) on delete cascade,
    novel_id uuid not null
        references public.novels(id) on delete cascade,
    added_at timestamptz not null default now(),

    primary key (user_id, novel_id)   -- เพิ่มเรื่องเดิมซ้ำไม่ได้
);

-- หน้า /library: ของผู้ใช้คนนี้ เรียงตามเวลาที่เพิ่ม
create index if not exists library_items_user_added_at_idx
on public.library_items (user_id, added_at desc);

-- =========================================================
-- 2. RLS: เห็นและแก้ได้เฉพาะของตัวเอง
-- =========================================================
alter table public.library_items enable row level security;

drop policy if exists "Users read own library" on public.library_items;
drop policy if exists "Users add to own library" on public.library_items;
drop policy if exists "Users remove from own library" on public.library_items;

create policy "Users read own library"
on public.library_items
for select
to authenticated
using (user_id = (select auth.uid()));

create policy "Users add to own library"
on public.library_items
for insert
to authenticated
with check (
    user_id = (select auth.uid())
    -- เพิ่มได้เฉพาะนิยายที่เผยแพร่แล้ว (กันการเดา id ของฉบับร่าง)
    -- ระบุ library_items.novel_id ชัดๆ กันชื่อคอลัมน์ไปชนกับคอลัมน์ใน novels ในอนาคต
    and exists (
        select 1 from public.novels n
        where n.id = library_items.novel_id
          and n.publication_status = 'published'
    )
);

create policy "Users remove from own library"
on public.library_items
for delete
to authenticated
using (user_id = (select auth.uid()));

-- ไม่มีอะไรให้แก้: เพิ่มหรือลบเท่านั้น
revoke update on public.library_items from anon, authenticated;
revoke all on public.library_items from anon;

-- =========================================================
-- 3. view สำหรับหน้า /library
--    หนึ่งแถว = นิยายหนึ่งเรื่องในชั้น + ความคืบหน้า (ถ้าเคยอ่าน)
-- =========================================================
drop view if exists public.library_entries;

create view public.library_entries
with (security_invoker = true)   -- ห้ามลืม ไม่อย่างนั้นจะข้าม RLS
as
select
    l.user_id,
    l.novel_id,
    l.added_at,
    n.title,
    n.author_name,
    n.cover_image_url,
    h.furthest_chapter_number,           -- null = ยังไม่เคยอ่านจบสักตอน
    h.last_read_at,
    greatest(l.added_at, h.last_read_at) as activity_at,   -- greatest ข้าม null ให้เอง
    (select count(*)
       from public.chapter_reads r
      where r.user_id = l.user_id
        and r.novel_id = l.novel_id) as read_count,
    (select count(*)
       from public.chapters c
      where c.novel_id = l.novel_id
        and c.publication_status = 'published') as total_chapters,
    nx.id             as next_chapter_id,
    nx.chapter_number as next_chapter_number
from public.library_items l
join public.novels n
  on n.id = l.novel_id
 and n.publication_status = 'published'
left join public.reading_history h
  on h.user_id = l.user_id
 and h.novel_id = l.novel_id
left join lateral (
    -- ยังไม่เคยอ่าน → ตอนแรก / เคยอ่าน → ตอนแรกที่เลขมากกว่าตอนที่ไกลที่สุด / ไม่มี → อ่านทันแล้ว
    select c.id, c.chapter_number
    from public.chapters c
    where c.novel_id = l.novel_id
      and c.publication_status = 'published'
      and (h.furthest_chapter_number is null
           or c.chapter_number > h.furthest_chapter_number)
    order by c.chapter_number
    limit 1
) nx on true;

revoke all on public.library_entries from anon;