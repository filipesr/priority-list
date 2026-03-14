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
import { LOAN_DIRECTIONS, LOAN_STATUSES } from "@/lib/constants";

export function LoanFilters() {
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
      router.push(`/loans?${params.toString()}`);
    },
    [router, searchParams]
  );

  const clearFilters = useCallback(() => {
    router.push("/loans");
  }, [router]);

  const hasFilters =
    searchParams.has("direction") ||
    searchParams.has("status") ||
    searchParams.has("search");

  return (
    <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:items-end">
      <div className="space-y-1 col-span-2">
        <Label className="text-xs">Buscar</Label>
        <Input
          placeholder="Buscar contraparte..."
          defaultValue={searchParams.get("search") ?? ""}
          onChange={(e) => updateFilter("search", e.target.value)}
          className="w-full sm:w-[200px] h-9"
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Direção</Label>
        <Select
          value={searchParams.get("direction") ?? "all"}
          onValueChange={(v) => updateFilter("direction", v)}
        >
          <SelectTrigger className="w-full sm:w-[170px] h-9">
            <SelectValue placeholder="Todas" items={[{ value: "all", label: "Todas" }, ...LOAN_DIRECTIONS]} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {LOAN_DIRECTIONS.map((d) => (
              <SelectItem key={d.value} value={d.value}>
                {d.label}
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
          <SelectTrigger className="w-full sm:w-[140px] h-9">
            <SelectValue placeholder="Todos" items={[{ value: "all", label: "Todos" }, ...LOAN_STATUSES]} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {LOAN_STATUSES.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
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
