-- supabase/migrations/20261120_chapter_reads.sql
-- บันทึกตอนที่ผู้ใช้อ่านจบแล้ว + view ประวัติการอ่าน
-- ต้องรันหลัง 20261118_profiles.sql
--
-- หนึ่งแถว = ผู้ใช้หนึ่งคนอ่านตอนหนึ่งจบ (บันทึกครั้งแรกครั้งเดียว อ่านซ้ำไม่อัปเดต)
-- ฝั่งแอปใช้: upsert(..., { onConflict: 'user_id,chapter_id', ignoreDuplicates: true })

-- =========================================================
-- 1. ให้ composite FK ชี้ chapters (id, novel_id) ได้
--    (ไฟล์ comments ก็มีบรรทัดนี้ ใส่ซ้ำไว้เพื่อให้รันไฟล์ไหนก่อนก็ได้)
-- =========================================================
create unique index if not exists chapters_id_novel_id_idx
on public.chapters (id, novel_id);

-- =========================================================
-- 2. ตาราง
-- =========================================================
create table if not exists public.chapter_reads (
    user_id uuid not null
        references public.profiles(id) on delete cascade,
    novel_id uuid not null
        references public.novels(id) on delete cascade,
    chapter_id uuid not null,
    read_at timestamptz not null default now(),   -- เวลาที่อ่านจบครั้งแรก

    primary key (user_id, chapter_id),

    -- ตอนต้องอยู่ในนิยายเรื่องนั้นจริง และลบตอนแล้วแถวหายตาม
    foreign key (chapter_id, novel_id)
        references public.chapters (id, novel_id)
        on delete cascade
);

-- ใช้กับ "ตอนที่อ่านแล้วของนิยาย X" และ view ประวัติการอ่าน
create index if not exists chapter_reads_user_novel_read_at_idx
on public.chapter_reads (user_id, novel_id, read_at desc);

-- =========================================================
-- 3. RLS: ข้อมูลส่วนตัว เห็นได้เฉพาะเจ้าของ
-- =========================================================
alter table public.chapter_reads enable row level security;

drop policy if exists "Users read own reads" on public.chapter_reads;
drop policy if exists "Users add own reads" on public.chapter_reads;
drop policy if exists "Users update own reads" on public.chapter_reads;  -- ลบของเวอร์ชันเก่า (ถ้ามี)
drop policy if exists "Users delete own reads" on public.chapter_reads;

create policy "Users read own reads"
on public.chapter_reads
for select
to authenticated
using (user_id = (select auth.uid()));

create policy "Users add own reads"
on public.chapter_reads
for insert
to authenticated
with check (user_id = (select auth.uid()));

-- เก็บไว้สำหรับปุ่ม "ยกเลิกอ่านแล้ว" ในอนาคต
create policy "Users delete own reads"
on public.chapter_reads
for delete
to authenticated
using (user_id = (select auth.uid()));

-- =========================================================
-- 4. สิทธิ์: ไม่มีการแก้ไข (insert-only + delete)
-- =========================================================
revoke update on public.chapter_reads from anon, authenticated;
revoke all on public.chapter_reads from anon;   -- คนที่ไม่ล็อกอินไม่ต้องยุ่งกับตารางนี้เลย

-- =========================================================
-- 5. view ประวัติการอ่าน
--    แต่ละ (ผู้ใช้, นิยาย) = 1 แถว
--    furthest_*   = ตอนที่ไกลที่สุดที่อ่านจบ (ใช้หาตอนถัดไปสำหรับปุ่ม "อ่านต่อ")
--    last_read_at = เวลาอ่านล่าสุด (ใช้เรียงหน้าประวัติ)
-- =========================================================
drop view if exists public.reading_history;   -- คอลัมน์เปลี่ยนจากเวอร์ชันเก่า จึงต้อง drop ก่อน

create view public.reading_history
with (security_invoker = true)   -- ห้ามลืม ไม่อย่างนั้น view จะข้าม RLS ทุกคนเห็นประวัติของทุกคน
as
select distinct on (r.user_id, r.novel_id)
    r.user_id,
    r.novel_id,
    r.chapter_id     as furthest_chapter_id,
    c.chapter_number as furthest_chapter_number,
    max(r.read_at) over (partition by r.user_id, r.novel_id) as last_read_at
from public.chapter_reads r
join public.chapters c on c.id = r.chapter_id
order by r.user_id, r.novel_id, c.chapter_number desc;

revoke all on public.reading_history from anon;
