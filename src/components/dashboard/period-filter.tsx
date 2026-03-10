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
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { MONTH_LABELS } from "@/lib/constants";

interface DashboardPeriodFilterProps {
  month: number;
  year: number;
}

export function DashboardPeriodFilter({ month, year }: DashboardPeriodFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const navigate = useCallback(
    (m: number, y: number) => {
      const now = new Date();
      const isCurrentMonth = m === now.getMonth() + 1 && y === now.getFullYear();
      if (isCurrentMonth) {
        router.push("/dashboard");
      } else {
        const params = new URLSearchParams(searchParams.toString());
        params.set("month", String(m));
        params.set("year", String(y));
        router.push(`/dashboard?${params.toString()}`);
      }
    },
    [router, searchParams]
  );

  const handlePrev = useCallback(() => {
    const prev = month === 1 ? { m: 12, y: year - 1 } : { m: month - 1, y: year };
    navigate(prev.m, prev.y);
  }, [month, year, navigate]);

  const handleNext = useCallback(() => {
    const next = month === 12 ? { m: 1, y: year + 1 } : { m: month + 1, y: year };
    navigate(next.m, next.y);
  }, [month, year, navigate]);

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="icon" className="h-10 w-10 sm:h-8 sm:w-8" onClick={handlePrev}>
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <Select value={String(month)} onValueChange={(v) => navigate(Number(v), year)}>
        <SelectTrigger className="w-[110px] sm:w-[130px] h-10 sm:h-8">
          <SelectValue items={Object.entries(MONTH_LABELS).map(([v, l]) => ({ value: v, label: l }))} />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(MONTH_LABELS).map(([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={String(year)} onValueChange={(v) => navigate(month, Number(v))}>
        <SelectTrigger className="w-[80px] sm:w-[90px] h-10 sm:h-8">
          <SelectValue items={years.map((y) => ({ value: String(y), label: String(y) }))} />
        </SelectTrigger>
        <SelectContent>
          {years.map((y) => (
            <SelectItem key={y} value={String(y)}>
              {y}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button variant="outline" size="icon" className="h-10 w-10 sm:h-8 sm:w-8" onClick={handleNext}>
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
