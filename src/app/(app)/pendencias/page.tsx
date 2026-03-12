import { Suspense } from "react";
import Link from "next/link";
import { getPendencias } from "@/actions/pendencias";
import { getUserCurrencyAndRates } from "@/actions/exchange-rates";
import { PendenciaList } from "@/components/pendencias/pendencia-list";
import { PendenciaFilters } from "@/components/pendencias/pendencia-filters";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ImportPendenciasDialog } from "@/components/pendencias/import-pendencias-dialog";

export default async function PendenciasPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const [result, { preferredCurrency, rates }] = await Promise.all([
    getPendencias({
      status: params.status,
      category: params.category,
      priority: params.priority,
      urgency: params.urgency,
      cost_center: params.cost_center,
      search: params.search,
    }),
    getUserCurrencyAndRates(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold">Pendências</h1>
          <p className="text-muted-foreground">
            Gerencie suas necessidades e tarefas pendentes
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ImportPendenciasDialog />
          <Button render={<Link href="/pendencias/new" />}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Pendência
          </Button>
        </div>
      </div>

      <Suspense fallback={<Skeleton className="h-10 w-full" />}>
        <PendenciaFilters />
      </Suspense>

      {result.success ? (
        <PendenciaList
          pendencias={result.data ?? []}
          preferredCurrency={preferredCurrency}
          rates={rates}
        />
      ) : (
        <p className="text-destructive">{result.error}</p>
      )}
    </div>
  );
}
