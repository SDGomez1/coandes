import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type FormatNumberOptions = Intl.NumberFormatOptions & {
  abbreviate?: boolean;
};

export function formatNumber(
  num: number,
  options?: FormatNumberOptions,
): string {
  const { abbreviate = false, ...numberFormatOptions } = options || {};

  const defaultNumberFormatOptions: Intl.NumberFormatOptions = {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
    ...numberFormatOptions,
  };

  if (abbreviate && Math.abs(num) >= 1_000_000_000) {
    return (
      new Intl.NumberFormat("en-US", {
        notation: "compact",
        ...defaultNumberFormatOptions,
        maximumFractionDigits:
          numberFormatOptions.maximumFractionDigits ??
          defaultNumberFormatOptions.maximumFractionDigits,
      }).format(num / 1_000_000_000) + "B"
    );
  }
  if (abbreviate && Math.abs(num) >= 1_000_000) {
    return (
      new Intl.NumberFormat("en-US", {
        notation: "compact",
        ...defaultNumberFormatOptions,
        maximumFractionDigits:
          numberFormatOptions.maximumFractionDigits ??
          defaultNumberFormatOptions.maximumFractionDigits,
      }).format(num / 1_000_000) + "M"
    );
  }
  if (abbreviate && Math.abs(num) >= 1_000) {
    return (
      new Intl.NumberFormat("en-US", {
        notation: "compact",
        ...defaultNumberFormatOptions,
        maximumFractionDigits:
          numberFormatOptions.maximumFractionDigits ??
          defaultNumberFormatOptions.maximumFractionDigits,
      }).format(num / 1_000) + "K"
    );
  }

  return new Intl.NumberFormat("en-US", defaultNumberFormatOptions).format(num);
}
