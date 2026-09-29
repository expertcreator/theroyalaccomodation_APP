import { headers as OW_HEADERS, raAppBaseUrl } from './apiEndpoints';
import { getAPIData } from './apiClient';

// Public, read-only endpoint exposed by our companion WordPress plugin (ra-app/v1).
// Occupied dates are public info (already on the site's own calendar) → no secret needed.
const RA_APP_BASE = raAppBaseUrl;

type AvailabilityData = {
    accomId: number;
    from: string;
    to: string;
    occupied: string[]; // ['YYYY-MM-DD', ...] — nights that are fully booked/blocked
};

/**
 * Fetch the occupied (unavailable) dates for one accommodation, between two dates.
 * Fails OPEN: returns [] on any error so the calendar still renders rather than
 * blocking every date. `from`/`to` are 'YYYY-MM-DD'.
 */
export async function getOccupiedDatesAPI(
    accomId: number,
    from: string,
    to: string,
): Promise<string[]> {
    const res = await getAPIData(
        `${RA_APP_BASE}/availability`,
        { accomId, from, to },   // query params
        undefined,               // skipAuth (→ withCredentials)
        undefined,               // signal
        OW_HEADERS,              // WAF-friendly headers
    );
    if (res?.success && Array.isArray((res.data as AvailabilityData)?.occupied)) {
        return (res.data as AvailabilityData).occupied;
    }
    return [];
}

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
export async function getRatesAPI(): Promise<RatesMap | null> {
    const res = await getAPIData(
        `${RA_APP_BASE}/rates`,
        undefined,   // no query params
        undefined,   // skipAuth
        undefined,   // signal
        OW_HEADERS,  // WAF-friendly headers (same recipe as /availability)
    );
    if (res?.success === true && res.data && typeof res.data === 'object') {
        return res.data as RatesMap;
    }
    return null;
}