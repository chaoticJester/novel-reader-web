-- นำเข้าตอนที่อ่านแล้วหลายตอนพร้อมกัน (ใช้ทั้งตอนอ่านจบ 1 ตอน และตอน sync จาก localStorage)
-- novel_id หาจากตาราง chapters เอง → client ส่ง novel_id ผิดไม่ได้
-- id ที่ไม่มีจริง / ถูกลบ / ยังไม่เผยแพร่ → ข้ามเงียบๆ ไม่ทำให้ทั้ง batch ล้ม
create or replace function public.import_chapter_reads(p_chapter_ids uuid[])
returns integer
language plpgsql
security invoker            -- ทำงานด้วยสิทธิ์ผู้เรียก: RLS ของ chapter_reads ยังบังคับใช้
set search_path = ''
as $$
declare
    v_count integer;
begin
    if (select auth.uid()) is null then
        raise exception 'not authenticated' using errcode = '42501';
    end if;

    if cardinality(p_chapter_ids) > 5000 then
        raise exception 'too many chapter ids' using errcode = '22023';
    end if;

    insert into public.chapter_reads (user_id, novel_id, chapter_id)
    select (select auth.uid()), c.novel_id, c.id
    from public.chapters c
    join public.novels n on n.id = c.novel_id
    where c.id = any (p_chapter_ids)
      and c.publication_status = 'published'
      and n.publication_status = 'published'
    on conflict (user_id, chapter_id) do nothing;   -- อ่านซ้ำ = ไม่ทำอะไร (เก็บเวลาอ่านครั้งแรก)

    get diagnostics v_count = row_count;
    return v_count;   -- จำนวนแถวที่เพิ่มใหม่จริง
end;
$$;

revoke execute on function public.import_chapter_reads(uuid[]) from public, anon;
grant execute on function public.import_chapter_reads(uuid[]) to authenticated;