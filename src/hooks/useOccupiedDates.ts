import { useCallback, useEffect, useRef, useState } from 'react';
import { getOccupiedDatesAPI } from '../api/raApi';
import { toISO, startOfDay, addMonths } from '../utils/date';

// How many months to fetch per request (the viewed month + the rest as a buffer).
const CHUNK_MONTHS = 3;

// 'YYYY-MM' key for a month.
const monthKeyOf = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

/**
 * Loads REAL occupied dates for a property, windowed around the viewed month and
 * extended as the user pages the calendar. Results ACCUMULATE — a fetch in flight
 * when the month changes still merges its data (it's valid regardless of the
 * current month), which is what makes far-future months and quick paging work.
 *
 * refresh() re-fetches the viewed months (e.g. when the screen comes back into
 * view), so dates booked by someone else in the meantime show up.
 */
export function useOccupiedDates(accomId: number, focusMonth: Date) {
    const [occupied, setOccupied] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    const occ = useRef<Set<string>>(new Set());        // all occupied dates gathered so far
    const loaded = useRef<Set<string>>(new Set());     // 'YYYY-MM' chunks confirmed fetched
    const inFlight = useRef<Set<string>>(new Set());   // 'YYYY-MM' chunks currently fetching
    const accomRef = useRef<number>(accomId);
    const focusRef = useRef<Date>(focusMonth);         // latest viewed month (for refresh)
    const mounted = useRef<boolean>(true);

    focusRef.current = focusMonth;

    // Only guard against setState after the screen is really gone.
    useEffect(() => {
        mounted.current = true;
        return () => { mounted.current = false; };
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

        setLoading(true);
        getOccupiedDatesAPI(forAccom, from, to)
            .then(list => {
                if (!mounted.current || accomRef.current !== forAccom) return;
                // This answer is the truth for [from, to): drop what we had there
                // (a night may have been freed), then add the fresh dates.
                for (const d of Array.from(occ.current)) {
                    if (d >= from && d < to) occ.current.delete(d);
                }
                for (const d of list) occ.current.add(d);
                chunkKeys.forEach(k => loaded.current.add(k)); // mark loaded on success
                setOccupied(Array.from(occ.current));          // always merges, even if month changed
            })
            .finally(() => {
                if (accomRef.current === forAccom) {
                    chunkKeys.forEach(k => inFlight.current.delete(k));
                }
                if (mounted.current && accomRef.current === forAccom) setLoading(false);
            });
    }, []);

    useEffect(() => {
        // Reset everything if the property changes.
        if (accomRef.current !== accomId) {
            accomRef.current = accomId;
            occ.current = new Set();
            loaded.current = new Set();
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

    return { occupied, loading, refresh };
}
