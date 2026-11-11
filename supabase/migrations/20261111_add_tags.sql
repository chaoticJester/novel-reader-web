-- Tags for novels (many-to-many).
-- tags:       each tag exists once (e.g. "Slow Burn" / slow-burn)
-- novel_tags: links a novel to a tag

create table if not exists public.tags (
    id bigint generated always as identity primary key,
    name text unique not null,
    slug text unique not null
);

create table if not exists public.novel_tags (
    novel_id uuid not null references public.novels(id) on delete cascade,
    tag_id bigint not null references public.tags(id) on delete cascade,
    primary key (novel_id, tag_id)
);

-- The primary key already makes lookups by novel_id fast.
-- This index makes "find all novels with tag X" fast too.
create index if not exists novel_tags_tag_id_idx
on public.novel_tags (tag_id);

-- Row Level Security
alter table public.tags enable row level security;
alter table public.novel_tags enable row level security;

drop policy if exists "Public can read tags" on public.tags;
drop policy if exists "Public can read tags of published novels" on public.novel_tags;

-- Tag names are not secret, so everyone can read all of them.
create policy "Public can read tags"
on public.tags
for select
to anon, authenticated
using (true);

-- Only show tag links for published novels (drafts stay hidden).
create policy "Public can read tags of published novels"
on public.novel_tags
for select
to anon, authenticated
using (
    exists (
        select 1
        from public.novels
        where novels.id = novel_tags.novel_id
          and novels.publication_status = 'published'
    )
);

-- No insert/update/delete policies: author actions use the service role
-- (supabase-admin.ts), which bypasses RLS.
