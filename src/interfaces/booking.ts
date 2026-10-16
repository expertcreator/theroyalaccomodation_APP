import type { PropertyId } from './property';

// 'upcoming' = not checked out yet, 'past' = stay is over. Worked out from the dates.
export type BookingStatus = 'upcoming' | 'past';

// One reservation on My Bookings. Comes from OWcal via the getMyBookings Cloud Function.
export interface Booking {
    accomId: number;
    id: number | null;           // OWcal booking number, e.g. 714 — shown as "#714" (see bookingNumber)
    ref: string;                 // OWcal letter reference, e.g. 'T5NMGEXP'
    propertyId: PropertyId;
    status: BookingStatus;
    checkIn: string;             // 'YYYY-MM-DD'
    checkOut: string;            // 'YYYY-MM-DD'
    adults: number;
    children: number;
    pets?: number;               // OWcal doesn't send this yet
    total: number;               // full price of the stay
    paid: number;                // amount paid so far
    amountToPay: number;         // balance still due (0 = fully paid)
    currency: string;            // e.g. 'GBP'
    owStatus: string;            // OWcal's own status, e.g. 'accepted' or 'pending'
    paymentStatus: string;       // OWcal's payment status
    bookedOn: string;            // when the reservation was made
}
