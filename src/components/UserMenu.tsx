import { getCurrentUser } from "@/lib/current-user";
import LoginLink from "@/components/LoginLink";
import UserMenuDropdown from "@/components/UserMenuDropdown";
import ReadingSync from "@/components/ReadingSync";

export default async function UserMenu() {
  const user = await getCurrentUser();

  if (!user) {
    return <LoginLink />;
  }

  return (
    <>
      <UserMenuDropdown displayName={user.displayName} avatarUrl={user.avatarUrl} />
      {/* อยู่ตรงนี้เพราะเป็นที่ที่รู้ว่าล็อกอินแล้ว และอยู่ใน Suspense อยู่แล้ว */}
      <ReadingSync userId={user.id} />
    </>
  );
}