import type { PropertyId } from './property';

export type BookingStatus = 'upcoming' | 'past';

export interface Booking {
    accomId: number;
    ref: string;                 // "RA-84029-WN"
    propertyId: PropertyId;
    status: BookingStatus;
    checkIn: string;             // ISO
    checkOut: string;            // ISO
    adults: number;
    children: number;
    pets: number;
    totalPaid: number;           // stored at time of booking (not recomputed)
}