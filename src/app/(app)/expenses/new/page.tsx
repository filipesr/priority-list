import { ExpenseForm } from "@/components/expenses/expense-form";

export default function NewExpensePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Nova Despesa</h1>
        <p className="text-muted-foreground">
          Adicione uma nova despesa ao seu controle
        </p>
      </div>
      <ExpenseForm />
    </div>
  );
}
