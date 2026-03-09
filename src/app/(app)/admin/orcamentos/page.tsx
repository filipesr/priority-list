import { redirect } from "next/navigation";
import { isAdmin } from "@/actions/admin";
import { getAllOrcamentos } from "@/actions/orcamentos";
import { getUsers } from "@/actions/admin";
import { OrcamentoList } from "@/components/admin/orcamento-list";

export default async function AdminOrcamentosPage() {
  const admin = await isAdmin();
  if (!admin) {
    redirect("/dashboard");
  }

  const result = await getAllOrcamentos();
  const orcamentos = result.data ?? [];

  const usersResult = await getUsers();
  const users = usersResult.data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Gerenciar Orçamentos</h1>
        <p className="text-muted-foreground">
          Crie, edite e gerencie orçamentos e seus membros.
        </p>
      </div>
      <OrcamentoList orcamentos={orcamentos} users={users} />
    </div>
  );
}
