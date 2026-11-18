-- supabase/migrations/20261118_profiles.sql
-- โปรไฟล์ผู้ใช้ + role (reader/admin) + ชื่อแสดงที่ไม่ซ้ำกัน

-- =========================================================
-- 1. ตาราง
-- =========================================================
create table if not exists public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    display_name text not null
        check (char_length(display_name) between 1 and 50),
    avatar_url text,
    role text not null default 'reader'
        check (role in ('reader', 'admin')),
    created_at timestamptz not null default now()
);

-- ชื่อห้ามซ้ำ โดยไม่สนตัวพิมพ์เล็กพิมพ์ใหญ่ (Kai = kai)
create unique index if not exists profiles_display_name_unique_idx
on public.profiles (lower(display_name));

-- =========================================================
-- 2. สร้าง profile อัตโนมัติตอนสมัคร
--    ลองชื่อทีละชั้น: ชื่อที่ขอมา → ชื่อสำรองแบบสั้น → ชื่อสำรองแบบเต็ม (ไม่มีทางซ้ำ)
--    ถ้า trigger นี้ error การสมัครจะล้มทั้งหมด จึงต้องมีทางสำรองที่ไม่มีทางพลาด
-- =========================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
    wanted_name text := nullif(left(trim(new.raw_user_meta_data ->> 'display_name'), 50), '');
    short_name text := 'anonymous-' || left(replace(new.id::text, '-', ''), 8);
    -- id เต็ม 32 ตัว ไม่มีทางซ้ำเพราะ id เป็น primary key (รวม 42 ตัว ไม่เกิน 50)
    full_name text := 'anonymous-' || replace(new.id::text, '-', '');
begin
    -- ชั้นที่ 1: ชื่อที่ผู้ใช้ขอมา
    if wanted_name is not null then
        begin
            insert into public.profiles (id, display_name) values (new.id, wanted_name);
            return new;
        exception when unique_violation then
            null;
        end;
    end if;

    -- ชั้นที่ 2: ชื่อสำรองแบบสั้น
    begin
        insert into public.profiles (id, display_name) values (new.id, short_name);
        return new;
    exception when unique_violation then
        null;
    end;

    -- ชั้นที่ 3: ชื่อสำรองแบบเต็ม
    insert into public.profiles (id, display_name) values (new.id, full_name);
    return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();

-- =========================================================
-- 3. RLS
-- =========================================================
alter table public.profiles enable row level security;

drop policy if exists "Public can read profiles" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;

create policy "Public can read profiles"
on public.profiles
for select
to anon, authenticated
using (true);

create policy "Users can update own profile"
on public.profiles
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

-- แก้ได้แค่ชื่อกับรูป ห้ามแตะ role
revoke update on public.profiles from anon, authenticated;
grant update (display_name, avatar_url) on public.profiles to authenticated;

-- ไม่มี policy insert: trigger สร้างให้
-- ไม่มี policy delete: ลบตาม auth.users (on delete cascade)