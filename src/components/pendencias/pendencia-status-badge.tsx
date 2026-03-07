import { Badge } from "@/components/ui/badge";
import { PENDENCIA_STATUS_LABELS, PENDENCIA_STATUS_COLORS } from "@/lib/constants";
import type { PendenciaStatus } from "@/lib/types";

export function PendenciaStatusBadge({ status }: { status: PendenciaStatus }) {
  return (
    <Badge variant="outline" className={PENDENCIA_STATUS_COLORS[status]}>
      {PENDENCIA_STATUS_LABELS[status]}
    </Badge>
  );
}
