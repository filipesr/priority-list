"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";
import { CATEGORIES, PRIORITIES, STATUSES, TYPES, COST_CENTERS } from "@/lib/constants";

export function ExpenseFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateFilter = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value && value !== "all") {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.push(`/expenses?${params.toString()}`);
    },
    [router, searchParams]
  );

  const clearFilters = useCallback(() => {
    router.push("/expenses");
  }, [router]);

  const hasFilters =
    searchParams.has("category") ||
    searchParams.has("priority") ||
    searchParams.has("status") ||
    searchParams.has("type") ||
    searchParams.has("cost_center") ||
    searchParams.has("search") ||
    searchParams.has("period");

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="space-y-1">
        <Label className="text-xs">Buscar</Label>
        <Input
          placeholder="Buscar despesa..."
          defaultValue={searchParams.get("search") ?? ""}
          onChange={(e) => updateFilter("search", e.target.value)}
          className="w-[200px] h-9"
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Categoria</Label>
        <Select
          value={searchParams.get("category") ?? "all"}
          onValueChange={(v) => updateFilter("category", v)}
        >
          <SelectTrigger className="w-[140px] h-9">
            <SelectValue placeholder="Todas" items={[{ value: "all", label: "Todas" }, ...CATEGORIES]} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Centro de Custo</Label>
        <Select
          value={searchParams.get("cost_center") ?? "all"}
          onValueChange={(v) => updateFilter("cost_center", v)}
        >
          <SelectTrigger className="w-[150px] h-9">
            <SelectValue placeholder="Todos" items={[{ value: "all", label: "Todos" }, ...COST_CENTERS]} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {COST_CENTERS.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Prioridade</Label>
        <Select
          value={searchParams.get("priority") ?? "all"}
          onValueChange={(v) => updateFilter("priority", v)}
        >
          <SelectTrigger className="w-[130px] h-9">
            <SelectValue placeholder="Todas" items={[{ value: "all", label: "Todas" }, ...PRIORITIES]} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {PRIORITIES.map((p) => (
              <SelectItem key={p.value} value={p.value}>
                {p.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Status</Label>
        <Select
          value={searchParams.get("status") ?? "all"}
          onValueChange={(v) => updateFilter("status", v)}
        >
          <SelectTrigger className="w-[140px] h-9">
            <SelectValue placeholder="Todos" items={[{ value: "all", label: "Todos" }, ...STATUSES.filter((s) => s.value !== "completed")]} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {STATUSES.filter((s) => s.value !== "completed").map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Tipo</Label>
        <Select
          value={searchParams.get("type") ?? "all"}
          onValueChange={(v) => updateFilter("type", v)}
        >
          <SelectTrigger className="w-[140px] h-9">
            <SelectValue placeholder="Todos" items={[{ value: "all", label: "Todos" }, ...TYPES]} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Período</Label>
        <Select
          value={searchParams.get("period") ?? "current_month"}
          onValueChange={(v) => updateFilter("period", v)}
        >
          <SelectTrigger className="w-[140px] h-9">
            <SelectValue placeholder="Todas" items={[{ value: "all", label: "Todas" }, { value: "current_month", label: "Mês Atual" }, { value: "future", label: "Futuras" }]} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="current_month">Mês Atual</SelectItem>
            <SelectItem value="future">Futuras</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters}>
          <X className="mr-1 h-4 w-4" />
          Limpar
        </Button>
      )}
    </div>
  );
}
