import type { SupportedCurrency } from "@/lib/types";
import { CURRENCY_LOCALES, CURRENCY_DECIMALS } from "@/lib/constants";

export type RateMap = Record<SupportedCurrency, number>;

const formatterCache = new Map<string, Intl.NumberFormat>();

function getFormatter(currency: SupportedCurrency): Intl.NumberFormat {
  let fmt = formatterCache.get(currency);
  if (!fmt) {
    fmt = new Intl.NumberFormat(CURRENCY_LOCALES[currency], {
      style: "currency",
      currency,
      minimumFractionDigits: CURRENCY_DECIMALS[currency],
      maximumFractionDigits: CURRENCY_DECIMALS[currency],
    });
    formatterCache.set(currency, fmt);
  }
  return fmt;
}

export function formatCurrency(
  value: number,
  currency: SupportedCurrency = "BRL"
): string {
  return getFormatter(currency).format(value);
}

/**
 * Convert amount between currencies using USD as pivot.
 * Rates are stored as "1 USD = X currency".
 * USD rate is always 1.
 */
export function convertAmount(
  amount: number,
  from: SupportedCurrency,
  to: SupportedCurrency,
  rates: RateMap
): number {
  if (from === to) return amount;
  const rateFrom = rates[from] || 1;
  const rateTo = rates[to] || 1;
  return (amount / rateFrom) * rateTo;
}

export function formatConverted(
  amount: number,
  from: SupportedCurrency,
  to: SupportedCurrency,
  rates: RateMap
): string {
  return formatCurrency(convertAmount(amount, from, to, rates), to);
}

export function parseCurrencyInput(value: string): number {
  const cleaned = value.replace(/[^\d,.-]/g, "").replace(",", ".");
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}
