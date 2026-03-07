import { notFound } from "next/navigation";
import { getExpense } from "@/actions/expenses";
import { ExpenseForm } from "@/components/expenses/expense-form";

export default async function EditExpensePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getExpense(id);

  if (!result.success || !result.data) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Editar Despesa</h1>
        <p className="text-muted-foreground">
          Atualize os dados da despesa
        </p>
      </div>
      <ExpenseForm expense={result.data} />
    </div>
  );
}
