-- กันสแปมคอมเมนต์ที่ระดับ DB: ใช้กับทุก insert ไม่ว่าจะมาจากเว็บหรือยิง REST API ตรง
--   - ห่างจากคอมเมนต์ล่าสุดของตัวเองอย่างน้อย 15 วินาที
--   - ไม่เกิน 20 คอมเมนต์ใน 10 นาที
create or replace function public.enforce_comment_rate_limit()
returns trigger
language plpgsql
security definer          -- ต้องเห็นคอมเมนต์ทุกแถวของผู้ใช้ รวมที่ถูกซ่อน (RLS ซ่อนจากเจ้าของ)
set search_path = ''
as $$
begin
    -- ล็อกต่อผู้ใช้จนจบ transaction: กด 2 ครั้งพร้อมกันจะได้ไม่ผ่านการเช็กทั้งคู่
    perform pg_advisory_xact_lock(hashtextextended(new.user_id::text, 0));

    if exists (
        select 1 from public.comments
        where user_id = new.user_id
          and created_at > now() - interval '15 seconds'
    ) then
        raise exception 'comment cooldown' using errcode = 'PT429';
    end if;

    if (
        select count(*) from public.comments
        where user_id = new.user_id
          and created_at > now() - interval '10 minutes'
    ) >= 20 then
        raise exception 'comment burst limit' using errcode = 'PT429';
    end if;

    return new;
end;
$$;

drop trigger if exists comments_rate_limit on public.comments;

create trigger comments_rate_limit
before insert on public.comments
for each row execute function public.enforce_comment_rate_limit();