"use client";

import { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CalendarClock } from "lucide-react";
import { postponeExpense } from "@/actions/expenses";
import { toast } from "sonner";

interface PostponeExpenseDialogProps {
  expenseId: string;
  currentDueDate?: string | null;
}

export function PostponeExpenseDialog({
  expenseId,
  currentDueDate,
}: PostponeExpenseDialogProps) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(currentDueDate ?? "");
  const [loading, setLoading] = useState(false);

  async function handlePostpone() {
    if (!date) return;
    setLoading(true);
    const result = await postponeExpense(expenseId, date);
    setLoading(false);
    if (result.success) {
      toast.success("Despesa adiada");
      setOpen(false);
    } else {
      toast.error(result.error);
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className="inline-flex items-center justify-center rounded-md h-8 w-8 hover:bg-accent hover:text-accent-foreground"
      >
        <CalendarClock className="h-4 w-4" />
      </PopoverTrigger>
      <PopoverContent className="w-auto" align="end">
        <div className="space-y-2">
          <p className="text-sm font-medium">Adiar para</p>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-auto"
          />
          <Button
            size="sm"
            className="w-full"
            onClick={handlePostpone}
            disabled={!date || loading}
          >
            {loading ? "Adiando..." : "Adiar"}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
