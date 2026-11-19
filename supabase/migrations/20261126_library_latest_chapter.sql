-- เพิ่ม latest_chapter_at: เวลาที่ตอนล่าสุด (ที่เผยแพร่) ถูกสร้าง ใช้เรียงชั้นหนังสือตามการอัปเดต
create or replace view public.library_entries
with (security_invoker = true)
as
select
    l.user_id,
    l.novel_id,
    l.added_at,
    n.title,
    n.author_name,
    n.cover_image_url,
    h.furthest_chapter_number,
    h.last_read_at,
    greatest(l.added_at, h.last_read_at) as activity_at,
    (select count(*)
       from public.chapter_reads r
      where r.user_id = l.user_id
        and r.novel_id = l.novel_id) as read_count,
    (select count(*)
       from public.chapters c
      where c.novel_id = l.novel_id
        and c.publication_status = 'published') as total_chapters,
    nx.id             as next_chapter_id,
    nx.chapter_number as next_chapter_number,
    pv.chapter_number as prev_chapter_number,
    (select max(c.created_at)
       from public.chapters c
      where c.novel_id = l.novel_id
        and c.publication_status = 'published') as latest_chapter_at   -- ← ใหม่ (null = ยังไม่มีตอน)
from public.library_items l
join public.novels n
  on n.id = l.novel_id
 and n.publication_status = 'published'
left join public.reading_history h
  on h.user_id = l.user_id
 and h.novel_id = l.novel_id
left join lateral (
    select c.id, c.chapter_number
    from public.chapters c
    where c.novel_id = l.novel_id
      and c.publication_status = 'published'
      and (h.furthest_chapter_number is null
           or c.chapter_number > h.furthest_chapter_number)
    order by c.chapter_number
    limit 1
) nx on true
left join lateral (
    select c.chapter_number
    from public.chapters c
    where c.novel_id = l.novel_id
      and c.publication_status = 'published'
      and c.chapter_number < h.furthest_chapter_number
    order by c.chapter_number desc
    limit 1
) pv on true;