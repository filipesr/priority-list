"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Upload, FileText, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  parseImportPendenciasFile,
  type ImportPendenciaResult,
} from "@/lib/import-pendencias";
import { importPendencias } from "@/actions/import-pendencias";

export function ImportPendenciasDialog() {
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<ImportPendenciaResult | null>(null);
  const [importing, setImporting] = useState(false);
  const [filename, setFilename] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function reset() {
    setResult(null);
    setFilename("");
    if (inputRef.current) inputRef.current.value = "";
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setFilename(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      const parsed = parseImportPendenciasFile(content, file.name);
      setResult(parsed);
    };
    reader.readAsText(file);
  }

  async function handleImport() {
    if (!result || result.pendencias.length === 0) return;

    setImporting(true);
    const res = await importPendencias(result.pendencias);
    setImporting(false);

    if (res.success) {
      toast.success(`${res.data?.imported} pendência(s) importada(s)`);
      setOpen(false);
      reset();
    } else {
      toast.error(res.error);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        setOpen(val);
        if (!val) reset();
      }}
    >
      <DialogTrigger render={<Button variant="outline" />}>
        <Upload className="mr-2 h-4 w-4" />
        Importar
      </DialogTrigger>
      <DialogContent className="sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>Importar Pendências</DialogTitle>
          <DialogDescription>
            Envie um arquivo CSV ou JSON com suas pendências.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div
            className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-dashed border-border/50 p-8 transition-colors hover:bg-accent/50"
            onClick={() => inputRef.current?.click()}
          >
            <FileText className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {filename || "Clique para selecionar arquivo (.csv ou .json)"}
            </p>
            <input
              ref={inputRef}
              type="file"
              accept=".csv,.json"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {result && (
            <div className="space-y-2 text-sm">
              {result.pendencias.length > 0 && (
                <p className="text-emerald-400">
                  {result.pendencias.length} pendência(s) prontas para importar
                </p>
              )}
              {result.errors.length > 0 && (
                <div className="space-y-1">
                  {result.errors.map((err, i) => (
                    <p key={i} className="flex items-start gap-1.5 text-destructive">
                      <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      Linha {err.row}: {err.message}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="space-y-4 text-xs text-muted-foreground">
            <div>
              <p className="font-medium text-sm text-foreground mb-2">Formato esperado</p>
              <p className="mb-1">CSV separado por <code className="rounded bg-accent/50 px-1">;</code> ou <code className="rounded bg-accent/50 px-1">,</code> — primeira linha é o cabeçalho. Também aceita JSON (array de objetos).</p>
            </div>

            <div className="rounded-lg bg-accent/50 p-4 space-y-3">
              <p className="font-medium text-foreground">Cabeçalho com todas as colunas:</p>
              <pre className="overflow-x-auto text-[11px] leading-relaxed">
{`nome;valor_estimado;categoria;prioridade;urgencia;centro_custo;moeda;descricao;notas`}
              </pre>

              <p className="font-medium text-foreground mt-3">Exemplos:</p>
              <div className="overflow-x-auto rounded-md bg-background/50 p-3">
                <table className="w-full text-[11px] leading-relaxed">
                  <thead>
                    <tr className="border-b border-border/30">
                      <th className="text-left py-1 pr-2 font-medium text-foreground">Caso</th>
                      <th className="text-left py-1 pr-2 font-medium text-foreground">Linha CSV</th>
                    </tr>
                  </thead>
                  <tbody className="font-mono">
                    <tr className="border-b border-border/20">
                      <td className="py-1.5 pr-2 font-sans text-muted-foreground">Com valor</td>
                      <td className="py-1.5"><code>Portão garagem;400000;casa;high;can_wait;casa;PYG;Portão automático;Orçamento João</code></td>
                    </tr>
                    <tr className="border-b border-border/20">
                      <td className="py-1.5 pr-2 font-sans text-muted-foreground">Sem valor</td>
                      <td className="py-1.5"><code>Dentista Filipe;;saude;medium;flexible;filipe;USD;Consulta inicial;</code></td>
                    </tr>
                    <tr>
                      <td className="py-1.5 pr-2 font-sans text-muted-foreground">Mínimo</td>
                      <td className="py-1.5"><code>Pintar quarto;;;low;flexible;casa;;;</code></td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-3">
                <div>
                  <p className="font-medium text-foreground mb-1">Colunas obrigatórias</p>
                  <p><code className="rounded bg-background/50 px-1">nome</code></p>
                </div>
                <div>
                  <p className="font-medium text-foreground mb-1">Centro de custo</p>
                  <p><code className="rounded bg-background/50 px-1">casa</code> <code className="rounded bg-background/50 px-1">carro</code> <code className="rounded bg-background/50 px-1">filipe</code> <code className="rounded bg-background/50 px-1">mayara</code> <code className="rounded bg-background/50 px-1">samuel</code> <code className="rounded bg-background/50 px-1">ana</code> <code className="rounded bg-background/50 px-1">outros</code></p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setOpen(false);
              reset();
            }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleImport}
            disabled={importing || !result || result.pendencias.length === 0}
          >
            {importing ? "Importando..." : "Importar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
