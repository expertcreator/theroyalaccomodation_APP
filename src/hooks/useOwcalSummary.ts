import { useEffect, useState } from 'react';
import { owGetSummary, OwSummary } from '../api/owcal';

// What the hook hands back to the screen on every render:
//   loading  → a price fetch is in flight (or debouncing) — show a spinner
//   summary  → the last successful OWcal summary (total, deposit, raw html), or null
//   error    → the last fetch failed or OWcal couldn't price these dates
type State = { loading: boolean; summary: OwSummary | null; error: boolean };

/**
 * Debounced hook that fetches the REAL OWcal price (ow_get_summary) for the
 * current date range / guest counts / pets.
 *
 * Why debounced: the inputs change on every +/- tap of adults/children/pets and
 * on each date pick. Firing the API on each keystroke-equivalent would hammer the
 * server, so we wait `debounceMs` after the last change before calling once.
 *
 * Only re-runs when a real input changes (see the deps array). Cancels any pending
 * request when inputs change again or the component unmounts, so a stale, slower
 * response can never overwrite a newer one (race-proof).
 */
export function useOwcalSummary(input: {
    accomId: number;
    checkIn: string | null;
    checkOut: string | null;
    adults: number;
    children: number;
    pets?: number;
    enabled?: boolean;    // set false to pause fetching (e.g. before the range is chosen)
    debounceMs?: number;  // wait after the last change before hitting the API (default 400ms)
}): State {
    // Defaults: no pets, enabled, 400ms debounce.
    const { accomId, checkIn, checkOut, adults, children, pets = 0, enabled = true, debounceMs = 400 } = input;

    const [state, setState] = useState<State>({ loading: false, summary: null, error: false });

    useEffect(() => {
        // Nothing to price yet: disabled, or the date range isn't complete.
        // Reset to a clean idle state (no spinner, no stale total, no error).
        if (!enabled || !checkIn || !checkOut) {
            setState({ loading: false, summary: null, error: false });
            return;
        }

        // Guards against a resolved-but-outdated request writing to state after
        // the inputs have already changed (see the cleanup return below).
        let cancelled = false;

        // Show the spinner right away — before the debounce window — so the UI
        // reacts instantly to the tap even though the network call is delayed.
        setState(s => ({ ...s, loading: true, error: false }));

        // Debounce: only actually call OWcal once the user has stopped changing
        // inputs for `debounceMs`. Each change resets this timer via cleanup.
        const timer = setTimeout(() => {
            owGetSummary({ accomId, checkIn, checkOut, adults, children, pets })
                // res.ok is false when OWcal returned HTML we couldn't price →
                // surface that as an error rather than a bogus £0 total.
                .then(res => { if (!cancelled) setState({ loading: false, summary: res, error: !res.ok }); })
                .catch(() => { if (!cancelled) setState({ loading: false, summary: null, error: true }); });
        }, debounceMs);

        // Cleanup runs on the next input change and on unmount:
        //  - cancelled = true → a request already in flight won't touch state
        //  - clearTimeout    → a debounce that hasn't fired yet is dropped
        return () => { cancelled = true; clearTimeout(timer); };
    }, [accomId, checkIn, checkOut, adults, children, pets, enabled, debounceMs]);

    return state;
}