// £ with thousands separators, no decimals. Manual grouping so it works
// regardless of Hermes Intl support. (RN parallel to your web lib/format.)
export const formatGBP = (n: number): string =>
    `£${Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;