import { useCallback, useEffect, useRef, useState } from 'react';
import { getOccupiedDatesAPI } from '../api/raApi';
import { toISO, startOfDay, addMonths } from '../utils/date';

// How many months to fetch per request (the viewed month + the rest as a buffer).
const CHUNK_MONTHS = 3;

// 'YYYY-MM' key for a month.
const monthKeyOf = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

// The viewed month's booked dates are:
//   loading → not known yet (first time)   → the calendar fades the days and says "Checking availability…"
//   error   → couldn't be loaded            → "Couldn't check availability" + Try Again
//   ready   → known (maybe being refreshed) → normal calendar
export type AvailabilityStatus = 'loading' | 'error' | 'ready';

/**
 * Loads REAL occupied dates for a property, windowed around the viewed month and
 * extended as the user pages the calendar. Results ACCUMULATE — a fetch in flight
 * when the month changes still merges its data (it's valid regardless of the
 * current month), which is what makes far-future months and quick paging work.
 *
 * refresh() re-fetches the viewed months (e.g. when the screen comes back into
 * view), so dates booked by someone else in the meantime show up.
 * retry() tries the viewed month again after it couldn't be loaded.
 * applyFresh() takes booked dates the screen already got from the server (the
 * Proceed re-check), so they show at once without waiting for another request.
 */
export function useOccupiedDates(accomId: number, focusMonth: Date) {
    const [occupied, setOccupied] = useState<string[]>([]);
    const [, setTick] = useState(0);   // re-render when a fetch starts or ends (the status below is read from refs)

    const occ = useRef<Set<string>>(new Set());          // all occupied dates gathered so far
    const loaded = useRef<Set<string>>(new Set());       // 'YYYY-MM' chunks fetched and still fresh
    const everLoaded = useRef<Set<string>>(new Set());   // chunks we've had a good answer for at least once
    const failed = useRef<Set<string>>(new Set());       // chunks whose last fetch failed
    const inFlight = useRef<Set<string>>(new Set());     // 'YYYY-MM' chunks currently fetching
    const accomRef = useRef<number>(accomId);
    const focusRef = useRef<Date>(focusMonth);           // latest viewed month (for refresh / retry)
    const mounted = useRef<boolean>(true);

    focusRef.current = focusMonth;

    // Only guard against setState after the screen is really gone.
    useEffect(() => {
        mounted.current = true;
        return () => { mounted.current = false; };
    }, []);

    // A server answer is the truth for [from, to): drop what we had there
    // (a night may have been freed), then add the fresh dates.
    const mergeRange = useCallback((from: string, to: string, list: string[]) => {
        for (const d of Array.from(occ.current)) {
            if (d >= from && d < to) occ.current.delete(d);
        }
        for (const d of list) occ.current.add(d);
        setOccupied(Array.from(occ.current));
    }, []);

    // Fetch the CHUNK_MONTHS months starting at `month` and merge them in.
    const fetchChunk = useCallback((month: Date) => {
        const start = new Date(month.getFullYear(), month.getMonth(), 1);
        const today = startOfDay(new Date());
        const from = toISO(start < today ? today : start); // never ask before today
        const to = toISO(addMonths(start, CHUNK_MONTHS));

        const chunkKeys = Array.from({ length: CHUNK_MONTHS }, (_, i) => monthKeyOf(addMonths(start, i)));
        chunkKeys.forEach(k => inFlight.current.add(k));

        // Capture the accom this fetch is for, so a late reply after a property
        // switch doesn't merge into the wrong property.
        const forAccom = accomRef.current;

        setTick(t => t + 1);   // show "loading" straight away
        getOccupiedDatesAPI(forAccom, from, to)
            .then(list => {
                if (!mounted.current || accomRef.current !== forAccom) return;
                if (list === null) {
                    // Couldn't load: keep whatever we already knew (never wipe booked
                    // dates), and remember it failed so the calendar can offer Try Again.
                    chunkKeys.forEach(k => failed.current.add(k));
                    return;
                }
                mergeRange(from, to, list);                    // always merges, even if month changed
                chunkKeys.forEach(k => {
                    loaded.current.add(k);
                    everLoaded.current.add(k);
                    failed.current.delete(k);
                });
            })
            .finally(() => {
                if (accomRef.current === forAccom) {
                    chunkKeys.forEach(k => inFlight.current.delete(k));
                }
                if (mounted.current && accomRef.current === forAccom) setTick(t => t + 1);
            });
    }, [mergeRange]);

    useEffect(() => {
        // Reset everything if the property changes.
        if (accomRef.current !== accomId) {
            accomRef.current = accomId;
            occ.current = new Set();
            loaded.current = new Set();
            everLoaded.current = new Set();
            failed.current = new Set();
            inFlight.current = new Set();
            setOccupied([]);
        }

        const monthKey = monthKeyOf(focusMonth);
        if (loaded.current.has(monthKey) || inFlight.current.has(monthKey)) return; // already have / getting it
        fetchChunk(focusMonth);

        // NOTE: no per-effect cleanup that cancels — that was discarding valid data.
    }, [accomId, focusMonth, fetchChunk]);

    // Fetch the viewed months again now, and treat every other month as stale
    // (it's fetched again when the guest pages to it).
    const refresh = useCallback(() => {
        loaded.current = new Set();
        fetchChunk(focusRef.current);
    }, [fetchChunk]);

    // Booked dates for [from, to) that the screen already has from the server
    // (Proceed's re-check). Shows them now; doesn't mark any month as loaded.
    const applyFresh = mergeRange;

    // "Try Again" after the viewed month couldn't be loaded.
    const retry = useCallback(() => {
        if (!inFlight.current.has(monthKeyOf(focusRef.current))) fetchChunk(focusRef.current);
    }, [fetchChunk]);

    // The viewed month's state. Once a month has loaded, it stays "ready" even while
    // it's refreshed (or a refresh fails) — the dates shown are still the best we have.
    const key = monthKeyOf(focusMonth);
    const status: AvailabilityStatus = everLoaded.current.has(key)
        ? 'ready'
        : failed.current.has(key) && !inFlight.current.has(key)
            ? 'error'
            : 'loading';
    const updating = status === 'ready' && inFlight.current.has(key);   // a refresh is running

    return { occupied, status, updating, refresh, retry, applyFresh };
}
