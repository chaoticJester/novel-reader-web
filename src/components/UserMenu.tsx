import { getCurrentUser } from "@/lib/current-user";
import LoginLink from "@/components/LoginLink";
import UserMenuDropdown from "@/components/UserMenuDropdown";

export default async function UserMenu() {
  const user = await getCurrentUser();

  if (!user) {
    return <LoginLink />;
  }

    return <UserMenuDropdown displayName={user.displayName} avatarUrl={user.avatarUrl} />;
}