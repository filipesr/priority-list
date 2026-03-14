import { LoanForm } from "@/components/loans/loan-form";

export default function NewLoanPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Novo Empréstimo</h1>
        <p className="text-muted-foreground">
          Registre um novo empréstimo
        </p>
      </div>
      <LoanForm />
    </div>
  );
}
