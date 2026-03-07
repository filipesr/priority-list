import { TableHead } from "@/components/ui/table";
import { ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface SortableHeaderProps {
  label: string;
  sortKey: string;
  active: boolean;
  direction: "asc" | "desc";
  onSort: (key: string) => void;
  className?: string;
}

export function SortableHeader({
  label,
  sortKey,
  active,
  direction,
  onSort,
  className,
}: SortableHeaderProps) {
  const Icon = active ? (direction === "asc" ? ChevronUp : ChevronDown) : null;

  return (
    <TableHead
      className={cn("cursor-pointer select-none", className)}
      onClick={() => onSort(sortKey)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {Icon && <Icon className="h-4 w-4" />}
      </span>
    </TableHead>
  );
}
