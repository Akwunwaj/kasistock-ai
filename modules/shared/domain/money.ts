export type MoneyCents = number & { readonly __brand: "MoneyCents" };

export function cents(value: number): MoneyCents {
  if (!Number.isSafeInteger(value)) {
    throw new Error("Money must be represented as a safe integer number of cents.");
  }
  return value as MoneyCents;
}

export function formatZar(value: MoneyCents): string {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
  }).format(value / 100);
}
