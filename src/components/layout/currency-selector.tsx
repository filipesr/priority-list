"use client";

import { useTransition } from "react";
import { updatePreferredCurrency } from "@/actions/profile";
import { CURRENCY_SYMBOLS, SUPPORTED_CURRENCIES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import type { SupportedCurrency } from "@/lib/types";

interface CurrencySelectorProps {
  current: SupportedCurrency;
}

export function CurrencySelector({ current }: CurrencySelectorProps) {
  const [isPending, startTransition] = useTransition();

  function handleChange(currency: SupportedCurrency) {
    if (currency === current) return;
    startTransition(() => {
      updatePreferredCurrency(currency);
    });
  }

  return (
    <div className="flex items-center gap-1">
      {SUPPORTED_CURRENCIES.map((c) => (
        <Button
          key={c}
          variant={c === current ? "default" : "ghost"}
          size="sm"
          className="h-7 px-2 text-xs"
          disabled={isPending}
          onClick={() => handleChange(c)}
        >
          {CURRENCY_SYMBOLS[c]}
        </Button>
      ))}
    </div>
  );
}
