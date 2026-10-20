import { headers as OW_HEADERS, raAppBaseUrl } from './apiEndpoints';
import { getAPIData, postDataAPI } from './apiClient';

// Public, read-only endpoint exposed by our companion WordPress plugin (ra-app/v1).
// Occupied dates are public info (already on the site's own calendar) → no secret needed.
const RA_APP_BASE = raAppBaseUrl;

type AvailabilityData = {
    accomId: number;
    from: string;
    to: string;
    occupied: string[]; // ['YYYY-MM-DD', ...] — nights that are fully booked/blocked
};

// Give up after 30 s (Android has no time limit of its own), so the calendar
// never waits forever — it shows "Couldn't check availability" instead.
const AVAILABILITY_TIMEOUT_MS = 30000;

/**
 * Fetch the occupied (unavailable) dates for one accommodation, between two dates.
 * Returns null if they couldn't be loaded — never [] — so a failure is never
 * mistaken for "nothing booked" (APP-4). `from`/`to` are 'YYYY-MM-DD'.
 */
export async function getOccupiedDatesAPI(
    accomId: number,
    from: string,
    to: string,
): Promise<string[] | null> {
    const res = await getAPIData(
        `${RA_APP_BASE}/availability`,
        { accomId, from, to },   // query params
        undefined,               // skipAuth (→ withCredentials)
        undefined,               // signal
        OW_HEADERS,              // WAF-friendly headers
        AVAILABILITY_TIMEOUT_MS,
    );
    if (res?.success && Array.isArray((res.data as AvailabilityData)?.occupied)) {
        return (res.data as AvailabilityData).occupied;
    }
    return null;   // couldn't load (no connection, timeout, server error)
}


////////////////////////////////////////////
export type ResidenceRate = {
    accomId: number;
    property: string;      // 'ascot' | 'windsor'
    from: number | null;   // lowest bookable nightly (what Home's "from £X" uses)
    to: number | null;     // highest nightly (for a future range display)
    currency: string;      // e.g. 'GBP'
};

// Keyed by accomId as a string, e.g. { "1680": {...}, "1225": {...} }
export type RatesMap = Record<string, ResidenceRate>;

/**
 * Fetch lowest/highest nightly rates per residence from the RA App plugin.
 * Returns the map on success, or null on ANY failure (either failure shape:
 * our {success:false} envelope, or a transport/WAF/500 error with no envelope).
 * getAPIData never throws — it returns null on network error — so callers just
 * check for null and fall back to cache / static constants.
 */
// The splash screen waits for this request, so it must never hang forever
// (on Android, React Native has no network time limit of its own).
const RATES_TIMEOUT_MS = 30000;

// quiet = no toast if it fails (used for background refreshes).
export async function getRatesAPI(quiet = false): Promise<RatesMap | null> {
    const res = await getAPIData(
        `${RA_APP_BASE}/rates`,
        undefined,   // no query params
        undefined,   // skipAuth
        undefined,   // signal
        OW_HEADERS,  // WAF-friendly headers (same recipe as /availability)
        RATES_TIMEOUT_MS,
        quiet,
    );
    if (res?.success === true && res.data && typeof res.data === 'object') {
        return res.data as RatesMap;
    }
    return null;
}


////////////////////////////////////////////
export type Review = {
    headline: string;
    reviewer: string;
    date: string;     // e.g. 'July 2025'
    rating: number;   // 0..5
    text: string;
    agency: string;   // e.g. 'Airbnb'
};

export type ResidenceReviews = {
    accomId: number;
    property: string;   // 'ascot' | 'windsor'
    average: number;    // 0 when no reviews
    count: number;      // number of published reviews
    reviews: Review[];
};

// Keyed by accomId as a string, e.g. { "1680": {...}, "1225": {...} }
export type ReviewsMap = Record<string, ResidenceReviews>;

/**
 * Fetch per-residence average rating + count + list from the RA App plugin.
 * Returns the map on success, or null on ANY failure (envelope success:false,
 * or a transport/WAF/500 error). getAPIData never throws — it returns null on
 * network error — so callers just check for null and fall back to cache / hide.
 */
// quiet = no toast if it fails (used for background refreshes).
export async function getReviewsAPI(quiet = false): Promise<ReviewsMap | null> {
    const res = await getAPIData(
        `${RA_APP_BASE}/reviews`,
        undefined,   // no query params
        undefined,   // skipAuth
        undefined,   // signal
        OW_HEADERS,
        undefined,   // timeout (none yet — see APP-3)
        quiet,
    );
    if (res?.success === true && res.data && typeof res.data === 'object') {
        return res.data as ReviewsMap;
    }
    return null;
}

////////////////////////////////////////////
export type EnquiryInput = {
    name: string;
    email: string;
    phone?: string;
    property?: string;
    message: string;
};

/**
 * Send a contact enquiry to the WP plugin (ra-app/v1/enquiry), which emails
 * the business + an acknowledgement to the guest.
 * Returns the { success, message } envelope, or null on a network error
 * (apiClient already shows a toast for that case).
 */
export async function sendEnquiryAPI(
    input: EnquiryInput,
): Promise<{ success: boolean; message: string } | null> {
    // OW_HEADERS carries Content-Type: application/x-www-form-urlencoded (for the
    // OWcal admin-ajax calls). But /enquiry is a wp-json REST endpoint and we send
    // a JSON object — if that urlencoded Content-Type wins, WordPress parses the
    // body as a form and every field arrives empty. So drop Content-Type from the
    // WAF headers and let postDataAPI default to application/json.
    const { 'Content-Type': _omit, ...wafHeaders } = OW_HEADERS;

    const res = await postDataAPI({
        url: `${raAppBaseUrl}/enquiry`,
        data: {
            name: input.name,
            email: input.email,
            phone: input.phone ?? '',
            property: input.property ?? '',
            message: input.message,
            company: '', // honeypot — always empty from the app
        },
        headers: wafHeaders, // browser-like headers for the WAF, minus Content-Type
        // ContentType defaults to 'application/json'
    });
    if (!res) return null;
    return { success: !!res.success, message: res.message ?? '' };
}
/* ---------- Checkout config — is in-app booking on, and which Stripe key ---------- */
// GET /checkout-config (public). The plugin decides this with its RA_APP_CHECKOUT
// switch: 'off' → the app shows "coming soon"; 'test' → Stripe test key; 'live' → real key.
export type CheckoutConfig = {
    enabled: boolean;
    mode: 'off' | 'test' | 'live';
    publishableKey: string | null;   // Stripe's public key — safe to have in the app
};

// The Payment screen waits for this, so never let it hang (see RATES_TIMEOUT_MS).
const CHECKOUT_CONFIG_TIMEOUT_MS = 30000;

/** Returns the config, or null if the site couldn't be reached. */
export async function getCheckoutConfigAPI(): Promise<CheckoutConfig | null> {
    const res = await getAPIData(
        `${RA_APP_BASE}/checkout-config`,
        undefined,   // no query params
        undefined,   // skipAuth
        undefined,   // signal
        OW_HEADERS,  // WAF-friendly headers
        CHECKOUT_CONFIG_TIMEOUT_MS,
    );
    const data = res?.success === true ? res.data : null;
    if (!data || typeof data.enabled !== 'boolean') return null;
    return {
        enabled: data.enabled && !!data.publishableKey,
        mode: data.mode === 'test' || data.mode === 'live' ? data.mode : 'off',
        publishableKey: data.publishableKey || null,
    };
}
