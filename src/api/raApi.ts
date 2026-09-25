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
export async function getOccupiedDates(
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