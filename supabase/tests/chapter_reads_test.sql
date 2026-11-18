-- supabase/tests/chapter_reads_test.sql
-- ทดสอบ profiles + chapter_reads + reading_history
-- รันทั้งไฟล์ใน Supabase SQL Editor: สร้างผู้ใช้ทดสอบชั่วคราวและลบทิ้งให้เองตอนจบ

drop table if exists pg_temp.test_results;
create temp table test_results (
    n int,
    name text,
    passed boolean,   -- null = ข้าม
    detail text
);

do $$
declare
    -- 8 ตัวแรกต่างกัน ยกเว้น D ที่จงใจให้ชนกับ B
    user_a constant uuid := 'aaaaaaaa-0000-4000-8000-000000000001';
    user_b constant uuid := 'bbbbbbbb-0000-4000-8000-000000000001';
    user_c constant uuid := 'cccccccc-0000-4000-8000-000000000001';
    user_d constant uuid := 'bbbbbbbb-0000-4000-8000-000000000002';

    v_novel uuid;
    v_chapter uuid;
    v_other_chapter uuid;

    v_ok boolean;
    v_detail text;
    v_count int;
    v_match boolean;
    v_name text;
    v_role text;
begin
    -- =====================================================
    -- เตรียมข้อมูล (ในฐานะ postgres)
    -- =====================================================
    delete from auth.users where id in (user_a, user_b, user_c, user_d);  -- เผื่อรอบก่อนค้าง

    select c.id, c.novel_id into v_chapter, v_novel
    from public.chapters c
    join public.novels n on n.id = c.novel_id
    where c.publication_status = 'published'
      and n.publication_status = 'published'
    limit 1;

    if v_chapter is null then
        raise exception 'ต้องมีตอนที่เผยแพร่แล้วอย่างน้อย 1 ตอนก่อนรันการทดสอบ';
    end if;

    select id into v_other_chapter
    from public.chapters
    where novel_id <> v_novel
    limit 1;

    insert into auth.users (id, email, raw_user_meta_data)
    values (user_a, 'rls-test-a@example.test', '{"display_name":"rls_tester_a"}');

    insert into auth.users (id, email, raw_user_meta_data)
    values (user_b, 'rls-test-b@example.test', '{}');

    -- C ขอชื่อซ้ำกับ A (ต่างแค่ตัวพิมพ์)
    insert into auth.users (id, email, raw_user_meta_data)
    values (user_c, 'rls-test-c@example.test', '{"display_name":"RLS_Tester_A"}');

    -- D ไม่ส่งชื่อมา และชื่อสำรองแบบสั้นจะชนกับ B
    insert into auth.users (id, email, raw_user_meta_data)
    values (user_d, 'rls-test-d@example.test', '{}');

    -- =====================================================
    -- 1–4: trigger สร้าง profile
    -- =====================================================
    select display_name, role into v_name, v_role
    from public.profiles where id = user_a;
    insert into pg_temp.test_results values (1,
        'profile: ใช้ชื่อที่ส่งมา และ role = reader',
        coalesce(v_name = 'rls_tester_a' and v_role = 'reader', false),
        format('display_name=%s, role=%s', v_name, v_role));

    select display_name into v_name from public.profiles where id = user_b;
    insert into pg_temp.test_results values (2,
        'profile: ไม่ส่งชื่อมา ได้ชื่อสำรองแบบสั้น',
        coalesce(v_name = 'anonymous-bbbbbbbb', false),
        format('display_name=%s', v_name));

    select display_name into v_name from public.profiles where id = user_c;
    insert into pg_temp.test_results values (3,
        'profile: ชื่อซ้ำ (ต่างตัวพิมพ์) ได้ชื่อสำรองแทน และสมัครไม่ล้ม',
        coalesce(v_name = 'anonymous-cccccccc', false),
        format('display_name=%s', v_name));

    select display_name into v_name from public.profiles where id = user_d;
    insert into pg_temp.test_results values (4,
        'profile: ชื่อสำรองแบบสั้นชนกัน ใช้ id เต็มแทน และสมัครไม่ล้ม',
        coalesce(v_name = 'anonymous-' || replace(user_d::text, '-', ''), false),
        format('display_name=%s', v_name));

    -- =====================================================
    -- 5: reader เลื่อนตัวเองเป็น admin ไม่ได้
    -- =====================================================
    v_ok := false; v_detail := null;
    begin
        perform set_config('role', 'authenticated', true);
        perform set_config('request.jwt.claims',
            json_build_object('sub', user_a, 'role', 'authenticated')::text, true);

        update public.profiles set role = 'admin' where id = user_a;

        v_detail := 'คำสั่งผ่าน ทั้งที่ควรถูกปฏิเสธ';
        raise exception 'undo';
    exception
        when insufficient_privilege then v_ok := true; v_detail := sqlerrm;
        when others then v_detail := coalesce(v_detail, sqlstate || ': ' || sqlerrm);
    end;
    reset role;
    insert into pg_temp.test_results values (5,
        'profiles: reader ตั้งตัวเองเป็น admin ไม่ได้ ⚠️ สำคัญ', v_ok, v_detail);

    -- =====================================================
    -- 6: แก้ชื่อตัวเองได้
    -- =====================================================
    v_ok := false; v_detail := null;
    begin
        perform set_config('role', 'authenticated', true);
        perform set_config('request.jwt.claims',
            json_build_object('sub', user_a, 'role', 'authenticated')::text, true);

        update public.profiles set display_name = 'rls_tester_a2' where id = user_a;
        get diagnostics v_count = row_count;

        v_ok := v_count = 1;
        v_detail := format('แก้ได้ %s แถว', v_count);
    exception when others then
        v_detail := sqlstate || ': ' || sqlerrm;
    end;
    reset role;
    insert into pg_temp.test_results values (6,
        'profiles: แก้ชื่อตัวเองได้', v_ok, v_detail);

    -- =====================================================
    -- 7: แก้ชื่อคนอื่นไม่ได้ (RLS กรองทิ้งเงียบๆ ได้ 0 แถว)
    -- =====================================================
    v_ok := false; v_detail := null;
    begin
        perform set_config('role', 'authenticated', true);
        perform set_config('request.jwt.claims',
            json_build_object('sub', user_a, 'role', 'authenticated')::text, true);

        update public.profiles set display_name = 'hacked' where id = user_b;
        get diagnostics v_count = row_count;

        v_ok := v_count = 0;
        v_detail := format('แก้ได้ %s แถว (ต้องเป็น 0)', v_count);
    exception when others then
        v_detail := sqlstate || ': ' || sqlerrm;
    end;
    reset role;
    insert into pg_temp.test_results values (7,
        'profiles: แก้ชื่อคนอื่นไม่ได้', v_ok, v_detail);

    -- =====================================================
    -- 8: ผู้ใช้ที่ล็อกอินแล้วเห็นนิยายและตอนที่เผยแพร่
    -- =====================================================
    v_ok := false; v_detail := null;
    begin
        perform set_config('role', 'authenticated', true);
        perform set_config('request.jwt.claims',
            json_build_object('sub', user_a, 'role', 'authenticated')::text, true);

        select count(*) into v_count
        from public.chapters c
        join public.novels n on n.id = c.novel_id
        where c.id = v_chapter;

        v_ok := v_count = 1;
        v_detail := case when v_count = 1 then 'เห็นตอนที่เผยแพร่'
            else 'มองไม่เห็น: policy ของ chapters/novels อาจกำหนดไว้แค่ to anon' end;
    exception when others then
        v_detail := sqlstate || ': ' || sqlerrm;
    end;
    reset role;
    insert into pg_temp.test_results values (8,
        'chapters/novels: authenticated อ่านตอนที่เผยแพร่ได้ ⚠️ สำคัญ', v_ok, v_detail);

    -- =====================================================
    -- 9: บันทึกการอ่านของตัวเองได้
    -- =====================================================
    v_ok := false; v_detail := null;
    begin
        perform set_config('role', 'authenticated', true);
        perform set_config('request.jwt.claims',
            json_build_object('sub', user_a, 'role', 'authenticated')::text, true);

        insert into public.chapter_reads (user_id, novel_id, chapter_id)
        values (user_a, v_novel, v_chapter);

        v_ok := true;
        v_detail := 'บันทึกสำเร็จ';
    exception when others then
        v_detail := sqlstate || ': ' || sqlerrm;
    end;
    reset role;
    insert into pg_temp.test_results values (9,
        'chapter_reads: บันทึกของตัวเองได้', v_ok, v_detail);

    -- =====================================================
    -- 10: บันทึกตอนเดิมซ้ำไม่ได้ (แอปจะใช้ ignoreDuplicates)
    -- =====================================================
    v_ok := false; v_detail := null;
    begin
        perform set_config('role', 'authenticated', true);
        perform set_config('request.jwt.claims',
            json_build_object('sub', user_a, 'role', 'authenticated')::text, true);

        insert into public.chapter_reads (user_id, novel_id, chapter_id)
        values (user_a, v_novel, v_chapter);

        v_detail := 'คำสั่งผ่าน ทั้งที่ควรถูกปฏิเสธ';
        raise exception 'undo';
    exception
        when unique_violation then v_ok := true; v_detail := sqlerrm;
        when others then v_detail := coalesce(v_detail, sqlstate || ': ' || sqlerrm);
    end;
    reset role;
    insert into pg_temp.test_results values (10,
        'chapter_reads: บันทึกซ้ำไม่ได้ (unique)', v_ok, v_detail);

    -- =====================================================
    -- 11: บันทึกแทนคนอื่นไม่ได้
    -- =====================================================
    v_ok := false; v_detail := null;
    begin
        perform set_config('role', 'authenticated', true);
        perform set_config('request.jwt.claims',
            json_build_object('sub', user_a, 'role', 'authenticated')::text, true);

        insert into public.chapter_reads (user_id, novel_id, chapter_id)
        values (user_b, v_novel, v_chapter);

        v_detail := 'คำสั่งผ่าน ทั้งที่ควรถูกปฏิเสธ';
        raise exception 'undo';
    exception
        when insufficient_privilege then v_ok := true; v_detail := sqlerrm;
        when others then v_detail := coalesce(v_detail, sqlstate || ': ' || sqlerrm);
    end;
    reset role;
    insert into pg_temp.test_results values (11,
        'chapter_reads: บันทึกแทนคนอื่นไม่ได้ (RLS)', v_ok, v_detail);

    -- =====================================================
    -- 12: ตอนต้องอยู่ในนิยายเรื่องนั้นจริง
    -- =====================================================
    if v_other_chapter is null then
        insert into pg_temp.test_results values (12,
            'chapter_reads: ตอนกับนิยายต้องตรงกัน (FK)', null,
            'ข้าม: ต้องมีนิยายอย่างน้อย 2 เรื่องที่มีตอน');
    else
        v_ok := false; v_detail := null;
        begin
            perform set_config('role', 'authenticated', true);
            perform set_config('request.jwt.claims',
                json_build_object('sub', user_a, 'role', 'authenticated')::text, true);

            insert into public.chapter_reads (user_id, novel_id, chapter_id)
            values (user_a, v_novel, v_other_chapter);

            v_detail := 'คำสั่งผ่าน ทั้งที่ควรถูกปฏิเสธ';
            raise exception 'undo';
        exception
            when foreign_key_violation then v_ok := true; v_detail := sqlerrm;
            when others then v_detail := coalesce(v_detail, sqlstate || ': ' || sqlerrm);
        end;
        reset role;
        insert into pg_temp.test_results values (12,
            'chapter_reads: ตอนกับนิยายต้องตรงกัน (FK)', v_ok, v_detail);
    end if;

    -- =====================================================
    -- 13: A เห็นประวัติของตัวเองใน view
    -- =====================================================
    v_ok := false; v_detail := null;
    begin
        perform set_config('role', 'authenticated', true);
        perform set_config('request.jwt.claims',
            json_build_object('sub', user_a, 'role', 'authenticated')::text, true);

        select count(*), coalesce(bool_and(furthest_chapter_id = v_chapter), false)
        into v_count, v_match
        from public.reading_history;

        v_ok := v_count = 1 and v_match;
        v_detail := format('เห็น %s แถว, ตอนไกลสุดถูกต้อง=%s', v_count, v_match);
    exception when others then
        v_detail := sqlstate || ': ' || sqlerrm;
    end;
    reset role;
    insert into pg_temp.test_results values (13,
        'reading_history: เห็นประวัติของตัวเอง', v_ok, v_detail);

    -- =====================================================
    -- 14–15: B มองไม่เห็นของ A
    -- =====================================================
    v_ok := false; v_detail := null;
    begin
        perform set_config('role', 'authenticated', true);
        perform set_config('request.jwt.claims',
            json_build_object('sub', user_b, 'role', 'authenticated')::text, true);

        select count(*) into v_count from public.chapter_reads;

        v_ok := v_count = 0;
        v_detail := format('เห็น %s แถว (ต้องเป็น 0)', v_count);
    exception when others then
        v_detail := sqlstate || ': ' || sqlerrm;
    end;
    reset role;
    insert into pg_temp.test_results values (14,
        'chapter_reads: คนอื่นมองไม่เห็น', v_ok, v_detail);

    v_ok := false; v_detail := null;
    begin
        perform set_config('role', 'authenticated', true);
        perform set_config('request.jwt.claims',
            json_build_object('sub', user_b, 'role', 'authenticated')::text, true);

        select count(*) into v_count from public.reading_history;

        v_ok := v_count = 0;
        v_detail := format('เห็น %s แถว (ต้องเป็น 0)', v_count);
    exception when others then
        v_detail := sqlstate || ': ' || sqlerrm;
    end;
    reset role;
    insert into pg_temp.test_results values (15,
        'reading_history: คนอื่นมองไม่เห็น (view ไม่รั่ว) ⚠️ สำคัญ', v_ok, v_detail);

    -- =====================================================
    -- 16: แก้ read_at ไม่ได้
    -- =====================================================
    v_ok := false; v_detail := null;
    begin
        perform set_config('role', 'authenticated', true);
        perform set_config('request.jwt.claims',
            json_build_object('sub', user_a, 'role', 'authenticated')::text, true);

        update public.chapter_reads set read_at = now() where user_id = user_a;

        v_detail := 'คำสั่งผ่าน ทั้งที่ควรถูกปฏิเสธ';
        raise exception 'undo';
    exception
        when insufficient_privilege then v_ok := true; v_detail := sqlerrm;
        when others then v_detail := coalesce(v_detail, sqlstate || ': ' || sqlerrm);
    end;
    reset role;
    insert into pg_temp.test_results values (16,
        'chapter_reads: แก้ไขไม่ได้ (insert-only)', v_ok, v_detail);

    -- =====================================================
    -- 17–18: anon เข้าไม่ได้เลย
    -- =====================================================
    v_ok := false; v_detail := null;
    begin
        perform set_config('role', 'anon', true);
        perform set_config('request.jwt.claims', '{"role":"anon"}', true);

        select count(*) into v_count from public.chapter_reads;

        v_detail := 'คำสั่งผ่าน ทั้งที่ควรถูกปฏิเสธ';
        raise exception 'undo';
    exception
        when insufficient_privilege then v_ok := true; v_detail := sqlerrm;
        when others then v_detail := coalesce(v_detail, sqlstate || ': ' || sqlerrm);
    end;
    reset role;
    insert into pg_temp.test_results values (17,
        'chapter_reads: anon เข้าไม่ได้', v_ok, v_detail);

    v_ok := false; v_detail := null;
    begin
        perform set_config('role', 'anon', true);
        perform set_config('request.jwt.claims', '{"role":"anon"}', true);

        select count(*) into v_count from public.reading_history;

        v_detail := 'คำสั่งผ่าน ทั้งที่ควรถูกปฏิเสธ';
        raise exception 'undo';
    exception
        when insufficient_privilege then v_ok := true; v_detail := sqlerrm;
        when others then v_detail := coalesce(v_detail, sqlstate || ': ' || sqlerrm);
    end;
    reset role;
    insert into pg_temp.test_results values (18,
        'reading_history: anon เข้าไม่ได้', v_ok, v_detail);

    -- =====================================================
    -- 19: ลบของตัวเองได้
    -- =====================================================
    v_ok := false; v_detail := null;
    begin
        perform set_config('role', 'authenticated', true);
        perform set_config('request.jwt.claims',
            json_build_object('sub', user_a, 'role', 'authenticated')::text, true);

        delete from public.chapter_reads where user_id = user_a;
        get diagnostics v_count = row_count;

        v_ok := v_count = 1;
        v_detail := format('ลบได้ %s แถว', v_count);
    exception when others then
        v_detail := sqlstate || ': ' || sqlerrm;
    end;
    reset role;
    insert into pg_temp.test_results values (19,
        'chapter_reads: ลบของตัวเองได้', v_ok, v_detail);

    -- =====================================================
    -- เก็บกวาด: ลบผู้ใช้ทดสอบ (profiles และ chapter_reads หายตาม cascade)
    -- =====================================================
    reset role;
    delete from auth.users where id in (user_a, user_b, user_c, user_d);
end;
$$;

-- =========================================================
-- ผลการทดสอบ
-- =========================================================
select
    n as "#",
    name as "การทดสอบ",
    case
        when passed is null then '⏭️ SKIP'
        when passed then '✅ PASS'
        else '❌ FAIL'
    end as "ผล",
    detail as "รายละเอียด"
from pg_temp.test_results
order by n;