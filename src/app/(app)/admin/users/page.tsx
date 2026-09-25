import { requireAdminPage } from "@/lib/auth/page-guards";
import { listUsers } from "@/lib/db/queries/users";
import { UsersManager } from "./users-manager";

export default async function AdminUsersPage() {
  const session = await requireAdminPage();
  const users = await listUsers();
  return <UsersManager initialUsers={users} currentRole={session.role} />;
}
