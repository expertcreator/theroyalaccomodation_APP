import type { Property } from '../interfaces/property';

export interface StayPrice {
    perNight: number;
    total: number;
    nights: number;
}

// Base rate covers `includedAdults`; each extra adult adds `extraAdultRate`
// per night. Children are free (not part of this calc).
export const calculateStayPrice = (property: Property, nights: number, adults: number): StayPrice => {
    const { baseRate, includedAdults, extraAdultRate } = property.pricing;
    const extraAdults = Math.max(0, adults - includedAdults);
    const perNight = baseRate + extraAdults * extraAdultRate;
    const safeNights = Math.max(nights, 0);
    return { perNight, total: perNight * safeNights, nights: safeNights };
};