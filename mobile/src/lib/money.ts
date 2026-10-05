/** Prices are stored as whole kobo so arithmetic never drifts. */
export function formatNaira(kobo: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(kobo / 100);
}

export const DELIVERY_KOBO = 250000; // ₦2,500 flat within Nigeria
export const FREE_DELIVERY_FROM_KOBO = 5000000; // free over ₦50,000

export function deliveryFor(subtotalKobo: number): number {
  if (subtotalKobo === 0) return 0;
  return subtotalKobo >= FREE_DELIVERY_FROM_KOBO ? 0 : DELIVERY_KOBO;
}
