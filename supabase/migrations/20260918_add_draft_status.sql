-- Keep publication state separate from an existing story-progress `status`
-- column (for example: ongoing/completed).
alter table public.novels
add column if not exists publication_status text not null default 'published';

alter table public.chapters
add column if not exists publication_status text not null default 'published';

alter table public.novels
drop constraint if exists novels_publication_status_check;

alter table public.novels
add constraint novels_publication_status_check
check (publication_status in ('draft', 'published'));

alter table public.chapters
drop constraint if exists chapters_publication_status_check;

alter table public.chapters
add constraint chapters_publication_status_check
check (publication_status in ('draft', 'published'));

drop policy if exists "Public can read novels" on public.novels;
drop policy if exists "Public can read chapters" on public.chapters;
drop policy if exists "Anyone can read novels" on public.novels;
drop policy if exists "Anyone can read chapters" on public.chapters;
drop policy if exists "Public can read published novels" on public.novels;
drop policy if exists "Public can read published chapters" on public.chapters;

create policy "Public can read published novels"
on public.novels
for select
to anon, authenticated
using (publication_status = 'published');

create policy "Public can read published chapters"
on public.chapters
for select
to anon, authenticated
using (
    publication_status = 'published'
    and exists (
        select 1
        from public.novels
        where novels.id = chapters.novel_id
          and novels.publication_status = 'published'
    )
);
