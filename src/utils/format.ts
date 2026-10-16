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

// The booking number guests see, e.g. "#714" — OWcal's booking Id (the "Id" column
// in OWcal admin). Falls back to OWcal's letter reference (e.g. "T5NMGEXP") if the
// number is missing. To show the letter reference instead, change only this line.
export const bookingNumber = (booking: { id?: number | null; ref: string }): string =>
    booking.id ? `#${booking.id}` : booking.ref;
