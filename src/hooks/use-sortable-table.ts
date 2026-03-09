"use client";

import { useMemo, useState } from "react";

type SortDirection = "asc" | "desc";

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}/;

function compareValues(a: unknown, b: unknown): number {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;

  if (typeof a === "number" && typeof b === "number") {
    return a - b;
  }

  const sa = String(a);
  const sb = String(b);

  if (ISO_DATE_RE.test(sa) && ISO_DATE_RE.test(sb)) {
    return new Date(sa).getTime() - new Date(sb).getTime();
  }

  return sa.localeCompare(sb, "pt-BR", { sensitivity: "base" });
}

export function useSortableTable<T>(
  items: T[],
  defaultKey?: string,
  defaultDir: SortDirection = "asc",
  valueGetters?: Record<string, (item: T) => unknown>,
) {
  const [sortKey, setSortKey] = useState<string | undefined>(defaultKey);
  const [sortDirection, setSortDirection] = useState<SortDirection>(defaultDir);

  function onSort(key: string) {
    if (key === sortKey) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  }

  const sorted = useMemo(() => {
    if (!sortKey) return items;
    const dir = sortDirection === "asc" ? 1 : -1;
    const getter = valueGetters?.[sortKey];
    return [...items].sort((a, b) => {
      const va = getter ? getter(a) : (a as Record<string, unknown>)[sortKey];
      const vb = getter ? getter(b) : (b as Record<string, unknown>)[sortKey];
      // Nulls always go to the bottom, regardless of sort direction
      if (va == null && vb == null) return 0;
      if (va == null) return 1;
      if (vb == null) return -1;
      return dir * compareValues(va, vb);
    });
  }, [items, sortKey, sortDirection, valueGetters]);

  return { sorted, sortKey, sortDirection, onSort } as const;
}
