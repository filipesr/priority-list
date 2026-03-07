import { PendenciaForm } from "@/components/pendencias/pendencia-form";

export default function NewPendenciaPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Nova Pendência</h1>
        <p className="text-muted-foreground">
          Adicione uma nova pendência ao seu controle
        </p>
      </div>
      <PendenciaForm />
    </div>
  );
}
