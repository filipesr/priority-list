import { redirect } from "next/navigation";
import { isAdmin, getUsers } from "@/actions/admin";
import { UserList } from "@/components/admin/user-list";

export default async function AdminPage() {
  const admin = await isAdmin();
  if (!admin) {
    redirect("/dashboard");
  }

  const result = await getUsers();
  const users = result.data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Gerenciar Usuários</h1>
        <p className="text-muted-foreground">
          Aprove ou rejeite o acesso de usuários ao sistema.
        </p>
      </div>
      <UserList users={users} />
    </div>
  );
}
