-- การตอบกลับ: ซ้อนได้ชั้นเดียว (parent ต้องเป็นคอมเมนต์หลัก)
alter table public.comments
    add column if not exists parent_id uuid
        references public.comments(id) on delete cascade;   -- ลบคอมเมนต์หลัก = การตอบกลับหายตาม

-- ดึงการตอบกลับของคอมเมนต์หลักหลายตัวพร้อมกัน เรียงเก่า → ใหม่
create index if not exists comments_parent_created_idx
on public.comments (parent_id, created_at)
where parent_id is not null;

create or replace function public.validate_comment_parent()
returns trigger
language plpgsql
security definer          -- ต้องเห็นคอมเมนต์ที่ถูกซ่อนด้วย (ไว้ปฏิเสธการตอบคอมเมนต์ที่ซ่อนแล้ว)
set search_path = ''
as $$
declare
    p record;
begin
    if new.parent_id is null then
        return new;   -- คอมเมนต์หลัก ไม่ต้องเช็ก
    end if;

    select c.novel_id, c.chapter_id, c.parent_id, c.hidden_at
    into p
    from public.comments c
    where c.id = new.parent_id;

    if not found then
        raise exception 'parent comment not found' using errcode = '23503';
    end if;
    if p.parent_id is not null then
        raise exception 'cannot reply to a reply' using errcode = '22023';
    end if;
    if p.hidden_at is not null then
        raise exception 'parent comment is hidden' using errcode = '22023';
    end if;
    -- is distinct from: เทียบ null ได้ถูกต้อง (null = null ใน SQL ไม่ได้ true)
    if p.novel_id <> new.novel_id or p.chapter_id is distinct from new.chapter_id then
        raise exception 'reply must be on the same page as its parent' using errcode = '22023';
    end if;

    return new;
end;
$$;

drop trigger if exists comments_validate_parent on public.comments;

create trigger comments_validate_parent
before insert on public.comments
for each row execute function public.validate_comment_parent();