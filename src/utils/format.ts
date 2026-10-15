// £ with thousands separators, no decimals. Manual grouping so it works
// regardless of Hermes Intl support. (RN parallel to your web lib/format.)
// showPence = true keeps the pence when there are any (e.g. £4,475.50 after a
// coupon) — whole amounts still show without decimals (£4,940).
export const formatGBP = (n: number, showPence = false): string => {
    const group = (whole: number) => whole.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    if (showPence && Math.round(n * 100) % 100 !== 0) {
        const [whole, pence] = n.toFixed(2).split('.');
        return `£${group(Number(whole))}.${pence}`;
    }
    return `£${group(Math.round(n))}`;
};
