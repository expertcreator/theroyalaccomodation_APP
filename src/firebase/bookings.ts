// My Bookings — loads the signed-in guest's real reservations from OWcal
// through our WordPress plugin's /me/bookings route.
//
// The app proves who the guest is with their Firebase sign-in token. The plugin
// checks that token and uses the email inside it, so no secret lives in the app.

import { getIdToken, reload } from '@react-native-firebase/auth';
import { auth } from './config';
import { postDataAPI } from '../api/apiClient';
import { headers as OW_HEADERS, raAppBaseUrl } from '../api/apiEndpoints';
import { PROPERTIES } from '../constants/data';
import type { Booking } from '../interfaces/booking';
import type { PropertyId } from '../interfaces/property';
import { toISO } from '../utils/date';

// One reservation as the plugin sends it.
type RemoteBooking = {
    id?: number | null;        // OWcal booking number (plugin v1.4.1+)
    ref: string;
    accomId: number;
    property: string | null;   // 'ascot' | 'windsor', or null for a residence the app doesn't know
    checkIn: string;
    checkOut: string;
    adults: number;
    children: number;
    status: string;
    paymentStatus: string;
    total: number;
    paid: number;
    amountToPay: number;
    currency: string;
    bookedOn: string;
};

// The plugin's reply. On errors, data.code says why
// ('invalid-token', 'email-not-verified' or 'unavailable').
type MeBookingsResponse = {
    success: boolean;
    message: string;
    data: { bookings?: RemoteBooking[]; code?: string } | null;
};

// What the screen gets back: the bookings, or a simple reason it couldn't load them.
export type MyBookingsResult =
    | { ok: true; bookings: Booking[] }
    | { ok: false; reason: 'email-not-verified' | 'failed' };

// Only residences the app knows how to show.
const isKnownProperty = (remote: RemoteBooking): boolean =>
    PROPERTIES.some((property) => property.id === remote.property);

// Convert one OWcal reservation into the app's Booking shape.
const toBooking = (remote: RemoteBooking): Booking => {
    // OWcal dates may carry a time ('YYYY-MM-DD HH:MM:SS') — keep just the date.
    const checkIn = remote.checkIn.slice(0, 10);
    const checkOut = remote.checkOut.slice(0, 10);
    const today = toISO(new Date());

    return {
        id: typeof remote.id === 'number' ? remote.id : null,
        ref: remote.ref,
        accomId: remote.accomId,
        propertyId: remote.property as PropertyId,   // safe — filtered by isKnownProperty first
        // Still upcoming until check-out day has passed. ('YYYY-MM-DD' strings compare correctly.)
        status: checkOut >= today ? 'upcoming' : 'past',
        checkIn,
        checkOut,
        adults: remote.adults,
        children: remote.children,
        total: remote.total,
        paid: remote.paid,
        amountToPay: remote.amountToPay,
        currency: remote.currency,
        owStatus: remote.status,
        paymentStatus: remote.paymentStatus,
        bookedOn: remote.bookedOn,
    };
};

// Ask the plugin for the signed-in guest's bookings.
// forceRefresh = true gets a brand-new token (e.g. right after they verify their email).
async function requestBookings(forceRefresh = false): Promise<MeBookingsResponse | null> {
    const user = auth.currentUser;
    if (!user) return null;
    const token = await getIdToken(user, forceRefresh);

    // Same firewall-friendly headers as the other plugin calls, minus the form
    // Content-Type — this is a JSON request (see sendEnquiryAPI in api/raApi.ts).
    const { 'Content-Type': _omit, ...wafHeaders } = OW_HEADERS;

    return postDataAPI({
        url: `${raAppBaseUrl}/me/bookings`,
        data: {},
        headers: { ...wafHeaders, 'X-Firebase-Token': token },
    });
}

// Right after the guest taps the verification link, their token can still say
// "not verified" for a while. Reload the user to see if Firebase now says verified.
async function isNowVerified(): Promise<boolean> {
    try {
        if (!auth.currentUser) return false;
        await reload(auth.currentUser);
        return auth.currentUser?.emailVerified === true; // reload() swaps in the updated user
    } catch {
        return false;
    }
}

/**
 * Load the signed-in guest's bookings. Never throws — returns a simple result
 * the screen can switch on.
 */
export async function loadMyBookings(): Promise<MyBookingsResult> {
    try {
        let response = await requestBookings();

        // Token says "not verified", but maybe they've verified since —
        // if so, ask again with a fresh token.
        if (response?.data?.code === 'email-not-verified' && (await isNowVerified())) {
            response = await requestBookings(true);
        }

        if (response?.success) {
            const remote = response.data?.bookings ?? [];
            return { ok: true, bookings: remote.filter(isKnownProperty).map(toBooking) };
        }
        if (response?.data?.code === 'email-not-verified') {
            return { ok: false, reason: 'email-not-verified' };
        }
        return { ok: false, reason: 'failed' };
    } catch {
        return { ok: false, reason: 'failed' };
    }
}
