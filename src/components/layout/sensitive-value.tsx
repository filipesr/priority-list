"use client";

import { useSensitiveMode } from "@/lib/contexts/sensitive-mode";

interface SensitiveValueProps {
  children: React.ReactNode;
  className?: string;
}

export function SensitiveValue({ children, className }: SensitiveValueProps) {
  const { isRevealed } = useSensitiveMode();

  if (!isRevealed) {
    return <span className={`select-none ${className ?? ""}`}>••••••</span>;
  }

  return <>{children}</>;
}

