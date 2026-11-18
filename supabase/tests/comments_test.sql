-- supabase/tests/comments_test.sql
-- ทดสอบ comments: คอมเมนต์นิยาย/ตอน, สิทธิ์ของ reader/admin/anon, การซ่อน, การลบ
-- รันทั้งไฟล์ใน Supabase SQL Editor: สร้างผู้ใช้ทดสอบชั่วคราวและลบทิ้งให้เองตอนจบ
-- ต้องรัน migration 20261118_profiles.sql และ 20261119_comments.sql ก่อน

drop table if exists pg_temp.test_results;
create temp table test_results (
    n int,
    name text,
    passed boolean,   -- null = ข้าม
    detail text
);

-- helper: สวมรอยเป็นผู้ใช้ (null = anon)
create or replace function pg_temp.act_as(p_user uuid)
returns void
language plpgsql
as $f$
begin
    if p_user is null then
        perform set_config('role', 'anon', true);
        perform set_config('request.jwt.claims', '{"role":"anon"}', true);
    else
        perform set_config('role', 'authenticated', true);
        perform set_config('request.jwt.claims',
            json_build_object('sub', p_user, 'role', 'authenticated')::text, true);
    end if;
end;
$f$;

do $$
declare
    user_a constant uuid := 'a2a2a2a2-0000-4000-8000-000000000001';  -- reader
    user_b constant uuid := 'b2b2b2b2-0000-4000-8000-000000000001';  -- reader
    user_m constant uuid := 'd2d2d2d2-0000-4000-8000-000000000001';  -- admin

    v_novel uuid;
    v_chapter uuid;
    v_other_chapter uuid;
    v_draft_chapter uuid;
    v_draft_chapter_novel uuid;
    v_draft_novel uuid;

    c_novel_a uuid;   -- คอมเมนต์นิยายของ A
    c_chap_a uuid;    -- คอมเมนต์ตอนของ A
    c_chap_b uuid;    -- คอมเมนต์ตอนของ B (จะถูกซ่อน แล้วถูกลบโดย admin)

    v_ok boolean;
    v_detail text;
    v_count int;
    v_bool boolean;
    v_text text;
begin
    -- =====================================================
    -- เตรียมข้อมูล (ในฐานะ postgres)
    -- =====================================================
    delete from auth.users where id in (user_a, user_b, user_m);

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
    from public.chapters where novel_id <> v_novel limit 1;

    select id, novel_id into v_draft_chapter, v_draft_chapter_novel
    from public.chapters where publication_status <> 'published' limit 1;

    select id into v_draft_novel
    from public.novels where publication_status <> 'published' limit 1;

    insert into auth.users (id, email, raw_user_meta_data) values
        (user_a, 'cmt-test-a@example.test', '{"display_name":"cmt_tester_a"}'),
        (user_b, 'cmt-test-b@example.test', '{"display_name":"cmt_tester_b"}'),
        (user_m, 'cmt-test-m@example.test', '{"display_name":"cmt_tester_admin"}');

    update public.profiles set role = 'admin' where id = user_m;

    -- =====================================================
    -- 1–2: is_admin()
    -- =====================================================
    v_ok := false; v_detail := null;
    begin
        perform pg_temp.act_as(user_a);
        select public.is_admin() into v_bool;
        v_ok := v_bool = false;
        v_detail := format('is_admin()=%s', v_bool);
    exception when others then
        v_detail := sqlstate || ': ' || sqlerrm;
    end;
    reset role;
    insert into pg_temp.test_results values (1,
        'is_admin(): reader ได้ false', v_ok, v_detail);

    v_ok := false; v_detail := null;
    begin
        perform pg_temp.act_as(user_m);
        select public.is_admin() into v_bool;
        v_ok := v_bool = true;
        v_detail := format('is_admin()=%s', v_bool);
    exception when others then
        v_detail := sqlstate || ': ' || sqlerrm;
    end;
    reset role;
    insert into pg_temp.test_results values (2,
        'is_admin(): admin ได้ true', v_ok, v_detail);

    -- =====================================================
    -- 3–5: สร้างคอมเมนต์ (ควรผ่าน)
    -- =====================================================
    v_ok := false; v_detail := null;
    begin
        perform pg_temp.act_as(user_a);
        insert into public.comments (novel_id, user_id, body)
        values (v_novel, user_a, 'คอมเมนต์นิยายจาก A')
        returning id into c_novel_a;
        v_ok := true; v_detail := 'สร้างสำเร็จ';
    exception when others then
        v_detail := sqlstate || ': ' || sqlerrm;
    end;
    reset role;
    insert into pg_temp.test_results values (3,
        'insert: reader คอมเมนต์นิยายได้ (chapter_id = null)', v_ok, v_detail);

    v_ok := false; v_detail := null;
    begin
        perform pg_temp.act_as(user_a);
        insert into public.comments (novel_id, chapter_id, user_id, body)
        values (v_novel, v_chapter, user_a, 'คอมเมนต์ตอนจาก A')
        returning id into c_chap_a;
        v_ok := true; v_detail := 'สร้างสำเร็จ';
    exception when others then
        v_detail := sqlstate || ': ' || sqlerrm;
    end;
    reset role;
    insert into pg_temp.test_results values (4,
        'insert: reader คอมเมนต์ตอนได้', v_ok, v_detail);

    v_ok := false; v_detail := null;
    begin
        perform pg_temp.act_as(user_b);
        insert into public.comments (novel_id, chapter_id, user_id, body)
        values (v_novel, v_chapter, user_b, 'คอมเมนต์ตอนจาก B')
        returning id into c_chap_b;
        v_ok := true; v_detail := 'สร้างสำเร็จ';
    exception when others then
        v_detail := sqlstate || ': ' || sqlerrm;
    end;
    reset role;
    insert into pg_temp.test_results values (5,
        'insert: reader อีกคนคอมเมนต์ตอนได้', v_ok, v_detail);

    -- =====================================================
    -- 6: คอมเมนต์ในนามคนอื่นไม่ได้
    -- =====================================================
    v_ok := false; v_detail := null;
    begin
        perform pg_temp.act_as(user_a);
        insert into public.comments (novel_id, user_id, body)
        values (v_novel, user_b, 'ปลอมเป็น B');
        v_detail := 'คำสั่งผ่าน ทั้งที่ควรถูกปฏิเสธ';
        raise exception 'undo';
    exception
        when insufficient_privilege then v_ok := true; v_detail := sqlerrm;
        when others then v_detail := coalesce(v_detail, sqlstate || ': ' || sqlerrm);
    end;
    reset role;
    insert into pg_temp.test_results values (6,
        'insert: คอมเมนต์ในนามคนอื่นไม่ได้ (RLS)', v_ok, v_detail);

    -- =====================================================
    -- 7–8: ตอนต้องอยู่ในนิยายเรื่องนั้น (ป้องกัน 2 ชั้น)
    -- =====================================================
    if v_other_chapter is null then
        insert into pg_temp.test_results values
            (7, 'insert: ตอนกับนิยายไม่ตรงกัน ถูก RLS ปฏิเสธ', null, 'ข้าม: ต้องมีนิยายอย่างน้อย 2 เรื่องที่มีตอน'),
            (8, 'insert: ตอนกับนิยายไม่ตรงกัน ถูก FK ปฏิเสธ (แม้ข้าม RLS)', null, 'ข้าม: ต้องมีนิยายอย่างน้อย 2 เรื่องที่มีตอน');
    else
        -- ชั้นที่ 1: RLS (is_published_comment_target เช็กว่าตอนอยู่ในนิยายนี้)
        v_ok := false; v_detail := null;
        begin
            perform pg_temp.act_as(user_a);
            insert into public.comments (novel_id, chapter_id, user_id, body)
            values (v_novel, v_other_chapter, user_a, 'ตอนผิดเรื่อง');
            v_detail := 'คำสั่งผ่าน ทั้งที่ควรถูกปฏิเสธ';
            raise exception 'undo';
        exception
            when insufficient_privilege then v_ok := true; v_detail := sqlerrm;
            when others then v_detail := coalesce(v_detail, sqlstate || ': ' || sqlerrm);
        end;
        reset role;
        insert into pg_temp.test_results values (7,
            'insert: ตอนกับนิยายไม่ตรงกัน ถูก RLS ปฏิเสธ', v_ok, v_detail);

        -- ชั้นที่ 2: FK (รันในฐานะ postgres ซึ่งข้าม RLS)
        v_ok := false; v_detail := null;
        begin
            insert into public.comments (novel_id, chapter_id, user_id, body)
            values (v_novel, v_other_chapter, user_a, 'ตอนผิดเรื่อง');
            v_detail := 'คำสั่งผ่าน ทั้งที่ควรถูกปฏิเสธ';
            raise exception 'undo';
        exception
            when foreign_key_violation then v_ok := true; v_detail := sqlerrm;
            when others then v_detail := coalesce(v_detail, sqlstate || ': ' || sqlerrm);
        end;
        insert into pg_temp.test_results values (8,
            'insert: ตอนกับนิยายไม่ตรงกัน ถูก FK ปฏิเสธ (แม้ข้าม RLS)', v_ok, v_detail);
    end if;

    -- =====================================================
    -- 9–10: คอมเมนต์ในตอน/นิยายที่ยังเป็นร่างไม่ได้
    -- =====================================================
    if v_draft_chapter is null then
        insert into pg_temp.test_results values (9,
            'insert: คอมเมนต์ตอนที่เป็นร่างไม่ได้', null, 'ข้าม: ไม่มีตอนที่เป็นร่าง');
    else
        v_ok := false; v_detail := null;
        begin
            perform pg_temp.act_as(user_a);
            insert into public.comments (novel_id, chapter_id, user_id, body)
            values (v_draft_chapter_novel, v_draft_chapter, user_a, 'แอบคอมเมนต์ตอนร่าง');
            v_detail := 'คำสั่งผ่าน ทั้งที่ควรถูกปฏิเสธ';
            raise exception 'undo';
        exception
            when insufficient_privilege then v_ok := true; v_detail := sqlerrm;
            when others then v_detail := coalesce(v_detail, sqlstate || ': ' || sqlerrm);
        end;
        reset role;
        insert into pg_temp.test_results values (9,
            'insert: คอมเมนต์ตอนที่เป็นร่างไม่ได้', v_ok, v_detail);
    end if;

    if v_draft_novel is null then
        insert into pg_temp.test_results values (10,
            'insert: คอมเมนต์นิยายที่เป็นร่างไม่ได้', null, 'ข้าม: ไม่มีนิยายที่เป็นร่าง');
    else
        v_ok := false; v_detail := null;
        begin
            perform pg_temp.act_as(user_a);
            insert into public.comments (novel_id, user_id, body)
            values (v_draft_novel, user_a, 'แอบคอมเมนต์นิยายร่าง');
            v_detail := 'คำสั่งผ่าน ทั้งที่ควรถูกปฏิเสธ';
            raise exception 'undo';
        exception
            when insufficient_privilege then v_ok := true; v_detail := sqlerrm;
            when others then v_detail := coalesce(v_detail, sqlstate || ': ' || sqlerrm);
        end;
        reset role;
        insert into pg_temp.test_results values (10,
            'insert: คอมเมนต์นิยายที่เป็นร่างไม่ได้', v_ok, v_detail);
    end if;

    -- =====================================================
    -- 11: ตั้งสถานะซ่อนเองตอนสร้างไม่ได้
    -- =====================================================
    v_ok := false; v_detail := null;
    begin
        perform pg_temp.act_as(user_a);
        insert into public.comments (novel_id, user_id, body, hidden_at)
        values (v_novel, user_a, 'ซ่อนเอง', now());
        v_detail := 'คำสั่งผ่าน ทั้งที่ควรถูกปฏิเสธ';
        raise exception 'undo';
    exception
        when insufficient_privilege then v_ok := true; v_detail := sqlerrm;
        when others then v_detail := coalesce(v_detail, sqlstate || ': ' || sqlerrm);
    end;
    reset role;
    insert into pg_temp.test_results values (11,
        'insert: ใส่ hidden_at เองไม่ได้', v_ok, v_detail);

    -- =====================================================
    -- 12–13: ความยาวข้อความ (check constraint)
    -- =====================================================
    v_ok := false; v_detail := null;
    begin
        perform pg_temp.act_as(user_a);
        insert into public.comments (novel_id, user_id, body)
        values (v_novel, user_a, '     ');
        v_detail := 'คำสั่งผ่าน ทั้งที่ควรถูกปฏิเสธ';
        raise exception 'undo';
    exception
        when check_violation then v_ok := true; v_detail := sqlerrm;
        when others then v_detail := coalesce(v_detail, sqlstate || ': ' || sqlerrm);
    end;
    reset role;
    insert into pg_temp.test_results values (12,
        'insert: ข้อความมีแต่ช่องว่างไม่ได้', v_ok, v_detail);

    v_ok := false; v_detail := null;
    begin
        perform pg_temp.act_as(user_a);
        insert into public.comments (novel_id, user_id, body)
        values (v_novel, user_a, repeat('ก', 2001));
        v_detail := 'คำสั่งผ่าน ทั้งที่ควรถูกปฏิเสธ';
        raise exception 'undo';
    exception
        when check_violation then v_ok := true; v_detail := sqlerrm;
        when others then v_detail := coalesce(v_detail, sqlstate || ': ' || sqlerrm);
    end;
    reset role;
    insert into pg_temp.test_results values (13,
        'insert: ข้อความเกิน 2000 ตัวไม่ได้', v_ok, v_detail);

    -- =====================================================
    -- 14–15: anon
    -- =====================================================
    v_ok := false; v_detail := null;
    begin
        perform pg_temp.act_as(null);
        insert into public.comments (novel_id, user_id, body)
        values (v_novel, user_a, 'anon แอบคอมเมนต์');
        v_detail := 'คำสั่งผ่าน ทั้งที่ควรถูกปฏิเสธ';
        raise exception 'undo';
    exception
        when insufficient_privilege then v_ok := true; v_detail := sqlerrm;
        when others then v_detail := coalesce(v_detail, sqlstate || ': ' || sqlerrm);
    end;
    reset role;
    insert into pg_temp.test_results values (14,
        'insert: anon คอมเมนต์ไม่ได้', v_ok, v_detail);

    v_ok := false; v_detail := null;
    begin
        perform pg_temp.act_as(null);
        select count(*) into v_count
        from public.comments where id in (c_novel_a, c_chap_a, c_chap_b);
        v_ok := v_count = 3;
        v_detail := format('เห็น %s จาก 3 คอมเมนต์', v_count);
    exception when others then
        v_detail := sqlstate || ': ' || sqlerrm;
    end;
    reset role;
    insert into pg_temp.test_results values (15,
        'select: anon อ่านคอมเมนต์ที่ไม่ถูกซ่อนได้', v_ok, v_detail);

    -- =====================================================
    -- 16–19: แก้ไข
    -- =====================================================
    v_ok := false; v_detail := null;
    begin
        perform pg_temp.act_as(user_a);
        update public.comments set body = 'A แก้ไขแล้ว' where id = c_chap_a;
        get diagnostics v_count = row_count;
        select body into v_text from public.comments where id = c_chap_a;
        v_ok := v_count = 1 and v_text = 'A แก้ไขแล้ว';
        v_detail := format('แก้ได้ %s แถว, body=%s', v_count, v_text);
    exception when others then
        v_detail := sqlstate || ': ' || sqlerrm;
    end;
    reset role;
    insert into pg_temp.test_results values (16,
        'update: แก้ข้อความของตัวเองได้', v_ok, v_detail);

    v_ok := false; v_detail := null;
    begin
        perform pg_temp.act_as(user_a);
        update public.comments set body = 'A แก้ของ B' where id = c_chap_b;
        get diagnostics v_count = row_count;
        v_ok := v_count = 0;
        v_detail := format('แก้ได้ %s แถว (ต้องเป็น 0)', v_count);
    exception when others then
        v_detail := sqlstate || ': ' || sqlerrm;
    end;
    reset role;
    insert into pg_temp.test_results values (17,
        'update: แก้คอมเมนต์ของคนอื่นไม่ได้', v_ok, v_detail);

    v_ok := false; v_detail := null;
    begin
        perform pg_temp.act_as(user_a);
        update public.comments set chapter_id = v_chapter where id = c_chap_a;
        v_detail := 'คำสั่งผ่าน ทั้งที่ควรถูกปฏิเสธ';
        raise exception 'undo';
    exception
        when insufficient_privilege then v_ok := true; v_detail := sqlerrm;
        when others then v_detail := coalesce(v_detail, sqlstate || ': ' || sqlerrm);
    end;
    reset role;
    insert into pg_temp.test_results values (18,
        'update: ย้ายคอมเมนต์ไปตอนอื่นไม่ได้ (แก้ได้แค่ body)', v_ok, v_detail);

    v_ok := false; v_detail := null;
    begin
        perform pg_temp.act_as(user_m);
        update public.comments set body = 'admin แก้คำพูดของ B' where id = c_chap_b;
        get diagnostics v_count = row_count;
        v_ok := v_count = 0;
        v_detail := format('แก้ได้ %s แถว (ต้องเป็น 0)', v_count);
    exception when others then
        v_detail := sqlstate || ': ' || sqlerrm;
    end;
    reset role;
    insert into pg_temp.test_results values (19,
        'update: admin ก็แก้ข้อความของคนอื่นไม่ได้ (ซ่อนหรือลบได้เท่านั้น)', v_ok, v_detail);

    -- =====================================================
    -- จำลอง server action ของ admin: ซ่อนคอมเมนต์ของ B
    -- (ในแอปจริงจะใช้ supabaseAdmin หลังเช็กว่าเป็น admin)
    -- =====================================================
    update public.comments
    set hidden_at = now(), hidden_by = user_m
    where id = c_chap_b;

    -- =====================================================
    -- 20–23: คอมเมนต์ที่ถูกซ่อน
    -- =====================================================
    v_ok := false; v_detail := null;
    begin
        perform pg_temp.act_as(null);
        select count(*) into v_count from public.comments where id = c_chap_b;
        v_ok := v_count = 0;
        v_detail := format('เห็น %s แถว (ต้องเป็น 0)', v_count);
    exception when others then
        v_detail := sqlstate || ': ' || sqlerrm;
    end;
    reset role;
    insert into pg_temp.test_results values (20,
        'hidden: anon มองไม่เห็นคอมเมนต์ที่ถูกซ่อน', v_ok, v_detail);

    v_ok := false; v_detail := null;
    begin
        perform pg_temp.act_as(user_b);
        select count(*) into v_count from public.comments where id = c_chap_b;
        v_ok := v_count = 0;
        v_detail := format('เห็น %s แถว (ตามที่ออกแบบไว้ต้องเป็น 0)', v_count);
    exception when others then
        v_detail := sqlstate || ': ' || sqlerrm;
    end;
    reset role;
    insert into pg_temp.test_results values (21,
        'hidden: เจ้าของก็มองไม่เห็นคอมเมนต์ตัวเองที่ถูกซ่อน', v_ok, v_detail);

    v_ok := false; v_detail := null;
    begin
        perform pg_temp.act_as(user_m);
        select count(*) into v_count from public.comments where id = c_chap_b;
        v_ok := v_count = 1;
        v_detail := format('เห็น %s แถว', v_count);
    exception when others then
        v_detail := sqlstate || ': ' || sqlerrm;
    end;
    reset role;
    insert into pg_temp.test_results values (22,
        'hidden: admin เห็นคอมเมนต์ที่ถูกซ่อน', v_ok, v_detail);

    v_ok := false; v_detail := null;
    begin
        perform pg_temp.act_as(user_b);
        update public.comments set hidden_at = null where id = c_chap_b;
        v_detail := 'คำสั่งผ่าน ทั้งที่ควรถูกปฏิเสธ';
        raise exception 'undo';
    exception
        when insufficient_privilege then v_ok := true; v_detail := sqlerrm;
        when others then v_detail := coalesce(v_detail, sqlstate || ': ' || sqlerrm);
    end;
    reset role;
    insert into pg_temp.test_results values (23,
        'hidden: เจ้าของยกเลิกการซ่อนเองไม่ได้ ⚠️ สำคัญ', v_ok, v_detail);

    -- =====================================================
    -- 24–26: ลบ
    -- =====================================================
    v_ok := false; v_detail := null;
    begin
        perform pg_temp.act_as(user_a);
        delete from public.comments where id = c_chap_b;
        get diagnostics v_count = row_count;
        v_ok := v_count = 0;
        v_detail := format('ลบได้ %s แถว (ต้องเป็น 0)', v_count);
    exception when others then
        v_detail := sqlstate || ': ' || sqlerrm;
    end;
    reset role;
    insert into pg_temp.test_results values (24,
        'delete: reader ลบคอมเมนต์ของคนอื่นไม่ได้', v_ok, v_detail);

    v_ok := false; v_detail := null;
    begin
        perform pg_temp.act_as(user_m);
        delete from public.comments where id = c_chap_b;
        get diagnostics v_count = row_count;
        v_ok := v_count = 1;
        v_detail := format('ลบได้ %s แถว', v_count);
    exception when others then
        v_detail := sqlstate || ': ' || sqlerrm;
    end;
    reset role;
    insert into pg_temp.test_results values (25,
        'delete: admin ลบคอมเมนต์ของคนอื่นได้', v_ok, v_detail);

    v_ok := false; v_detail := null;
    begin
        perform pg_temp.act_as(user_a);
        delete from public.comments where id = c_novel_a;
        get diagnostics v_count = row_count;
        v_ok := v_count = 1;
        v_detail := format('ลบได้ %s แถว', v_count);
    exception when others then
        v_detail := sqlstate || ': ' || sqlerrm;
    end;
    reset role;
    insert into pg_temp.test_results values (26,
        'delete: reader ลบคอมเมนต์ของตัวเองได้', v_ok, v_detail);

    -- =====================================================
    -- 27: ลบผู้ใช้แล้วคอมเมนต์หายตาม (cascade)
    -- =====================================================
    reset role;
    delete from auth.users where id = user_a;
    select count(*) into v_count from public.comments where id = c_chap_a;
    insert into pg_temp.test_results values (27,
        'cascade: ลบผู้ใช้แล้วคอมเมนต์ของเขาหายตาม',
        v_count = 0 and c_chap_a is not null,
        format('เหลือ %s แถว (ต้องเป็น 0)', v_count));

    -- =====================================================
    -- เก็บกวาด
    -- =====================================================
    delete from auth.users where id in (user_a, user_b, user_m);
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
