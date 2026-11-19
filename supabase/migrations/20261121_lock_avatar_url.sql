-- avatar_url เขียนได้เฉพาะ server (service role) หลังตรวจไฟล์แล้ว
-- ผู้ใช้ยังแก้ display_name ได้ตามเดิม
revoke update (avatar_url) on public.profiles from authenticated;