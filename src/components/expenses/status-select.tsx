"use client";

import { updateExpenseStatus } from "@/actions/expenses";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { STATUS_LABELS } from "@/lib/constants";
import type { ExpenseStatus } from "@/lib/types";
import { toast } from "sonner";

export function StatusSelect({
  expenseId,
  currentStatus,
}: {
  expenseId: string;
  currentStatus: ExpenseStatus;
}) {
  async function handleChange(value: string | null) {
    if (!value) return;
    const result = await updateExpenseStatus(
      expenseId,
      value as ExpenseStatus
    );
    if (result.success) {
      toast.success("Status atualizado");
    } else {
      toast.error(result.error);
    }
  }

  return (
    <Select defaultValue={currentStatus} onValueChange={handleChange}>
      <SelectTrigger className="w-[140px] h-8 text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {Object.entries(STATUS_LABELS).map(([value, label]) => (
          <SelectItem key={value} value={value}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
