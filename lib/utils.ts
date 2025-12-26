import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: string | number, currencyCode?: string): string {
  // Get currency from parameter or default to USD
  // Note: Don't read from localStorage here as it causes hydration mismatches
  // Components should handle currency preference via useState/useEffect
  const currency = currencyCode || "USD";

  const num = typeof amount === "string" ? parseFloat(amount) : amount;

  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(num);
  } catch (error) {
    // Fallback if currency code is invalid
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(num);
  }
}

export function calculateSavings(
  targetPrice: string,
  currentPrice: string | null
): number | null {
  if (!currentPrice) return null;
  const target = parseFloat(targetPrice);
  const current = parseFloat(currentPrice);
  return target - current;
}

export function generateShareToken(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function calculatePriceDrop(
  currentPrice: string | null,
  targetPrice: string
): number | null {
  if (!currentPrice) return null;

  const current = parseFloat(currentPrice);
  const target = parseFloat(targetPrice);

  if (isNaN(current) || isNaN(target) || target === 0) return null;

  return ((target - current) / target) * 100;
}
