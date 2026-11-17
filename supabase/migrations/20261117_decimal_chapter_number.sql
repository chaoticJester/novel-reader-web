-- Allow decimal chapter numbers (e.g. 1.5, 10.25 for side/extra chapters).
-- Existing integer values are kept as-is (1 -> 1.00).
-- Indexes / unique constraints on chapter_number are carried over automatically.

alter table public.chapters
    alter column chapter_number type numeric(10, 2)
    using chapter_number::numeric(10, 2);
