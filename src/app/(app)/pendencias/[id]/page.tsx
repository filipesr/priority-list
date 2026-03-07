import { notFound } from "next/navigation";
import { getPendencia } from "@/actions/pendencias";
import { PendenciaForm } from "@/components/pendencias/pendencia-form";

export default async function EditPendenciaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getPendencia(id);

  if (!result.success || !result.data) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Editar Pendência</h1>
        <p className="text-muted-foreground">
          Atualize os dados da pendência
        </p>
      </div>
      <PendenciaForm pendencia={result.data} />
    </div>
  );
}
