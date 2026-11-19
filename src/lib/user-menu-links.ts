// ลิงก์ในเมนูผู้ใช้ ใช้ร่วมกันทั้ง dropdown บนคอม และลิ้นชักเมนูบนมือถือ
// แยกไว้นอกไฟล์ "use client" เพื่อให้ Server Component import ไปเรียกใช้ได้
export type UserMenuLink = { href: string; label: string };

export const USER_MENU_LINKS: UserMenuLink[] = [
  { href: "/profile", label: "โปรไฟล์" },
  { href: "/library", label: "ชั้นหนังสือ" },
];
