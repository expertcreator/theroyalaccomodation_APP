import type { Property } from '../interfaces/property';

export const PET_FEE = 295; // flat, per pet, for the whole stay (not per night)

export interface StayPrice {
    perNight: number;
    total: number;
    nights: number;
    petsFee: number;
}

// Base rate covers `includedAdults`; each extra adult adds `extraAdultRate` per night.
// Children are free. Pets add a flat PET_FEE each (not per night, not counted as guests).
export const calculateStayPrice = (
    property: Property,
    nights: number,
    adults: number,
    pets: number = 0,
): StayPrice => {
    const { baseRate, includedAdults, extraAdultRate } = property.pricing;
    const extraAdults = Math.max(0, adults - includedAdults);
    const perNight = baseRate + extraAdults * extraAdultRate;
    const safeNights = Math.max(nights, 0);
    const petsFee = Math.max(pets, 0) * PET_FEE;
    return { perNight, total: perNight * safeNights + petsFee, nights: safeNights, petsFee };
};