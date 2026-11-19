"use server";

import { refresh } from "next/cache";
import { getCurrentUser } from "@/lib/current-user";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { validateDisplayName } from "@/lib/display-name";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { removeManagedAvatar, resizeAvatar, uploadAvatar, validateAvatarFile } from '@/lib/avatar-storage'

export type DisplayNameState = {
  error?: string;
  success?: boolean;
  values?: { displayName: string };
};

export async function updateDisplayName(
  _previousState: DisplayNameState,
  formData: FormData,
): Promise<DisplayNameState> {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "กรุณาเข้าสู่ระบบใหม่" };
  }

  const displayName = String(formData.get("displayName") ?? "").trim();
  const values = { displayName };

  const invalid = validateDisplayName(displayName);
  if (invalid) {
    return { error: invalid, values };
  }

  // ชื่อเดิมเป๊ะ ไม่ต้องยิง query
  if (displayName === user.displayName) {
    return { success: true };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("profiles")
    .update({ display_name: displayName })
    .eq("id", user.id)
    .select("id");

  if (error) {
    // 23505 = unique_violation: ชนกับ profiles_display_name_unique_idx
    if (error.code === "23505") {
      return { error: "ชื่อนี้ถูกใช้แล้ว ลองชื่ออื่นดูนะ", values };
    }
    return { error: "บันทึกไม่สำเร็จ กรุณาลองใหม่", values };
  }

  // RLS ไม่ให้แก้ = ไม่ error แต่ได้ 0 แถว ต้องเช็กเอง
  if (data.length === 0) {
    return { error: "บันทึกไม่สำเร็จ กรุณาลองใหม่", values };
  }

  // ให้ client โหลดหน้าใหม่ Navbar จะได้โชว์ชื่อใหม่ทันที
  refresh();
  return { success: true };
}

export type AvatarState = {
  error?: string;
  success?: boolean;
};

export async function updateAvatar(
  _previousState: AvatarState,
  formData: FormData,
): Promise<AvatarState> {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "กรุณาเข้าสู่ระบบใหม่" };
  }

  const result = validateAvatarFile(formData.get("avatar"));
  if ("error" in result) {
    return { error: result.error };
  }

  // 1) ย่อรูป: ถ้าถอดรหัสไม่ได้ แปลว่าไม่ใช่รูปจริง (ถึงนามสกุลจะเป็น .jpg ก็ตาม)
  let image: Buffer
  try {
      image = await resizeAvatar(result.file)
  } catch {
      return { error: 'อ่านไฟล์รูปไม่ได้ ลองรูปอื่นดูนะ' }
  }

  // 2) อัปโหลดไฟล์ที่ย่อแล้ว
  let newUrl: string
  try {
      newUrl = await uploadAvatar(user.id, image)
  } catch (error) {
      console.error(error)
      return { error: 'อัปโหลดรูปไม่สำเร็จ กรุณาลองใหม่' }
  }

  // 3) ชี้ profile ไปที่ไฟล์ใหม่ (ผู้ใช้ไม่มีสิทธิ์แก้คอลัมน์นี้แล้ว จึงต้องใช้ admin)
  const { error } = await supabaseAdmin
    .from("profiles")
    .update({ avatar_url: newUrl })
    .eq("id", user.id);

  if (error) {
    await removeManagedAvatar(user.id, newUrl); // บันทึกไม่สำเร็จ: ลบไฟล์ที่เพิ่งอัป ไม่ให้ค้าง
    return { error: "บันทึกรูปไม่สำเร็จ กรุณาลองใหม่" };
  }

  // 4) สำเร็จแล้วค่อยลบไฟล์เก่า
  await removeManagedAvatar(user.id, user.avatarUrl);

  refresh();
  return { success: true };
}

export async function removeAvatar(): Promise<void> {
  const user = await getCurrentUser();
  if (!user?.avatarUrl) return;

  const { error } = await supabaseAdmin
    .from("profiles")
    .update({ avatar_url: null })
    .eq("id", user.id);

  if (error) {
    throw new Error("ลบรูปไม่สำเร็จ");
  }

  await removeManagedAvatar(user.id, user.avatarUrl);
  refresh();
}
