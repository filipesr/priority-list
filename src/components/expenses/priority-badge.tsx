import { Badge } from "@/components/ui/badge";
import { PRIORITY_LABELS, PRIORITY_COLORS } from "@/lib/constants";
import type { PriorityLevel } from "@/lib/types";

export function PriorityBadge({ priority }: { priority: PriorityLevel }) {
  return (
    <Badge variant="outline" className={PRIORITY_COLORS[priority]}>
      {PRIORITY_LABELS[priority]}
    </Badge>
  );
}
