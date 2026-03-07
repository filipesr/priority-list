import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "@/lib/currency";

interface BudgetProgressProps {
  label: string;
  value: number;
  limit: number;
  colorClass?: string;
}

export function BudgetProgress({
  label,
  value,
  limit,
  colorClass,
}: BudgetProgressProps) {
  const percentage = limit > 0 ? Math.min((value / limit) * 100, 100) : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">
          {formatCurrency(value)} / {formatCurrency(limit)}
        </span>
      </div>
      <Progress value={percentage} className={colorClass} />
      <p className="text-xs text-muted-foreground text-right">
        {percentage.toFixed(1)}%
      </p>
    </div>
  );
}
