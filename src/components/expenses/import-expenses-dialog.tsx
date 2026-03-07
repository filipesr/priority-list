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
import { parseImportFile, type ImportResult } from "@/lib/import-expenses";
import { importExpenses } from "@/actions/import-expenses";

export function ImportExpensesDialog() {
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
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
      const parsed = parseImportFile(content, file.name);
      setResult(parsed);
    };
    reader.readAsText(file);
  }

  async function handleImport() {
    if (!result || result.expenses.length === 0) return;

    setImporting(true);
    const res = await importExpenses(result.expenses);
    setImporting(false);

    if (res.success) {
      toast.success(`${res.data?.imported} despesa(s) importada(s)`);
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Importar Despesas</DialogTitle>
          <DialogDescription>
            Envie um arquivo CSV ou JSON com suas despesas.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div
            className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-dashed border-border/50 p-6 transition-colors hover:bg-accent/50"
            onClick={() => inputRef.current?.click()}
          >
            <FileText className="h-8 w-8 text-muted-foreground" />
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
              {result.expenses.length > 0 && (
                <p className="text-emerald-400">
                  {result.expenses.length} despesa(s) prontas para importar
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

          <details className="text-xs text-muted-foreground">
            <summary className="cursor-pointer">Formato esperado</summary>
            <div className="mt-2 space-y-2 rounded-md bg-accent/50 p-3 font-mono">
              <p className="font-sans font-medium">CSV (separado por ; ou ,):</p>
              <pre className="overflow-x-auto">
{`nome;valor;categoria;tipo;prioridade;urgencia
Aluguel;2500;casa;recorrente;critical;urgent
Dentista;800;saude;esporadico;high;can_wait`}
              </pre>
              <p className="font-sans font-medium">Colunas opcionais:</p>
              <p>vencimento, descricao, notas, recorrente, dia_recorrencia</p>
            </div>
          </details>
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
            disabled={importing || !result || result.expenses.length === 0}
          >
            {importing ? "Importando..." : "Importar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
