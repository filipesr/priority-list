"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { CURRENCY_SYMBOLS } from "@/lib/constants";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Trash2 } from "lucide-react";
import { deleteExchangeRate } from "@/actions/exchange-rates";
import { toast } from "sonner";
import type { ExchangeRate, SupportedCurrency } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ExchangeRateHistoryProps {
  rates: ExchangeRate[];
  isAdmin: boolean;
}

export function ExchangeRateHistory({
  rates,
  isAdmin,
}: ExchangeRateHistoryProps) {
  async function handleDelete(id: string) {
    if (!confirm("Tem certeza que deseja excluir esta taxa?")) return;
    const result = await deleteExchangeRate(id);
    if (result.success) {
      toast.success("Taxa excluída");
    } else {
      toast.error(result.error);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Histórico de Taxas</CardTitle>
      </CardHeader>
      <CardContent>
        {rates.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground">
            Nenhuma taxa registrada
          </p>
        ) : (
          <div className="rounded-md border border-border/50">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Moeda</TableHead>
                  <TableHead>Taxa (1 USD =)</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="hidden md:table-cell">Notas</TableHead>
                  {isAdmin && <TableHead className="w-[60px]">Ações</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rates.map((rate) => (
                  <TableRow key={rate.id}>
                    <TableCell className="font-medium">
                      {CURRENCY_SYMBOLS[rate.currency as SupportedCurrency]}{" "}
                      {rate.currency}
                    </TableCell>
                    <TableCell>
                      {Number(rate.rate).toLocaleString("pt-BR", {
                        maximumFractionDigits: 6,
                      })}
                    </TableCell>
                    <TableCell>
                      {format(new Date(rate.effective_date + "T12:00:00"), "dd/MM/yyyy", {
                        locale: ptBR,
                      })}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {rate.notes || "—"}
                    </TableCell>
                    {isAdmin && (
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => handleDelete(rate.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
