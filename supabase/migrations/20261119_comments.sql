-- supabase/migrations/20261119_comments.sql
-- คอมเมนต์ของนิยาย (chapter_id = null) และของตอน (chapter_id มีค่า)
-- ต้องรันหลัง 20261118_profiles.sql

-- =========================================================
-- 1. helper functions
-- =========================================================
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
    select exists (
        select 1 from public.profiles
        where id = auth.uid() and role = 'admin'
    );
$$;

-- นิยาย (และตอน ถ้ามี) เผยแพร่แล้วหรือยัง
create or replace function public.is_published_comment_target(
    p_novel_id uuid,
    p_chapter_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
    select
        exists (
            select 1 from public.novels
            where id = p_novel_id
              and publication_status = 'published'
        )
        and (
            p_chapter_id is null
            or exists (
                select 1 from public.chapters
                where id = p_chapter_id
                  and novel_id = p_novel_id
                  and publication_status = 'published'
            )
        );
$$;

-- =========================================================
-- 2. ให้ composite foreign key ชี้ไปที่ chapters (id, novel_id) ได้
-- =========================================================
create unique index if not exists chapters_id_novel_id_idx
on public.chapters (id, novel_id);

-- =========================================================
-- 3. ตาราง
-- =========================================================
create table if not exists public.comments (
    id uuid primary key default gen_random_uuid(),

    novel_id uuid not null
        references public.novels(id) on delete cascade,
    chapter_id uuid,   -- null = คอมเมนต์ของนิยาย

    user_id uuid not null
        references public.profiles(id) on delete cascade,
    body text not null
        check (char_length(trim(body)) between 1 and 2000),

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    -- การซ่อนโดย admin (null = ไม่ได้ซ่อน)
    -- ผู้เขียนคอมเมนต์ก็มองไม่เห็นคอมเมนต์ของตัวเองที่ถูกซ่อน (ตัดสินใจแล้ว)
    hidden_at timestamptz,
    hidden_by uuid references public.profiles(id) on delete set null,

    -- ตอนต้องอยู่ในนิยายเรื่องเดียวกัน และลบตอนแล้วคอมเมนต์หายตาม
    foreign key (chapter_id, novel_id)
        references public.chapters (id, novel_id)
        on delete cascade
);

-- หน้าตอน: คอมเมนต์ของตอน X เรียงจากใหม่สุด
create index if not exists comments_chapter_created_idx
on public.comments (chapter_id, created_at desc)
where chapter_id is not null;

-- หน้านิยาย: คอมเมนต์ของนิยาย X (เฉพาะที่ไม่ได้อยู่ในตอน)
create index if not exists comments_novel_created_idx
on public.comments (novel_id, created_at desc)
where chapter_id is null;

-- =========================================================
-- 4. updated_at อัตโนมัติ (เฉพาะตอนแก้ข้อความ)
-- =========================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
    new.updated_at := now();
    return new;
end;
$$;

drop trigger if exists comments_set_updated_at on public.comments;

create trigger comments_set_updated_at
    before update of body on public.comments
    for each row execute function public.set_updated_at();

-- =========================================================
-- 5. RLS
-- =========================================================
alter table public.comments enable row level security;

drop policy if exists "Read visible comments" on public.comments;
drop policy if exists "Users can create comments" on public.comments;
drop policy if exists "Users can edit own comments" on public.comments;
drop policy if exists "Owners and admins can delete comments" on public.comments;

create policy "Read visible comments"
on public.comments
for select
to anon, authenticated
using (
    (select public.is_admin())
    or (
        hidden_at is null
        and public.is_published_comment_target(novel_id, chapter_id)
    )
);

create policy "Users can create comments"
on public.comments
for insert
to authenticated
with check (
    user_id = (select auth.uid())
    and hidden_at is null
    and hidden_by is null
    and public.is_published_comment_target(novel_id, chapter_id)
);

create policy "Users can edit own comments"
on public.comments
for update
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy "Owners and admins can delete comments"
on public.comments
for delete
to authenticated
using (
    user_id = (select auth.uid())
    or (select public.is_admin())
);

-- =========================================================
-- 6. สิทธิ์ระดับคอลัมน์: แก้ได้แค่ข้อความ
-- =========================================================
revoke update on public.comments from anon, authenticated;
grant update (body) on public.comments to authenticated;
-- การซ่อนโดย admin ทำผ่าน server action + supabaseAdmin
