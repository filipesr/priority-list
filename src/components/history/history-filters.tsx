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
import { CATEGORIES, COST_CENTERS } from "@/lib/constants";

function getCurrentMonthDefaults() {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth() + 1;
  const startDate = `${y}-${String(m).padStart(2, "0")}-01`;
  const endDate = new Date(y, m, 0).toISOString().split("T")[0];
  return { startDate, endDate };
}

export function HistoryFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaults = getCurrentMonthDefaults();

  const updateFilter = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value && value !== "all") {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.push(`/history?${params.toString()}`);
    },
    [router, searchParams]
  );

  const clearFilters = useCallback(() => {
    router.push("/history");
  }, [router]);

  const hasFilters =
    searchParams.has("category") ||
    searchParams.has("cost_center") ||
    searchParams.has("startDate") ||
    searchParams.has("endDate");

  return (
    <div className="flex flex-wrap items-end gap-3">
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
        <Label className="text-xs">De</Label>
        <Input
          type="date"
          className="w-[160px] h-9"
          defaultValue={searchParams.get("startDate") ?? defaults.startDate}
          onChange={(e) => updateFilter("startDate", e.target.value)}
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Até</Label>
        <Input
          type="date"
          className="w-[160px] h-9"
          defaultValue={searchParams.get("endDate") ?? defaults.endDate}
          onChange={(e) => updateFilter("endDate", e.target.value)}
        />
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
